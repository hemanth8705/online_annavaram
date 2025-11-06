from __future__ import annotations

import logging
import os
from typing import Optional

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConfigurationError

from .models import DOCUMENT_MODELS

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None


def _resolve_database(client: AsyncIOMotorClient):
    database_name = os.getenv("MONGODB_DB_NAME")
    if database_name:
        return client[database_name]
    try:
        return client.get_default_database()
    except ConfigurationError:
        pass
    return client["online_annavaram"]


async def connect_to_database() -> AsyncIOMotorClient:
    global _client
    if _client is not None:
        return _client

    uri = os.getenv("MONGODB_URI")
    if not uri:
        uri = "mongodb://127.0.0.1:27017/online_annavaram"
        logger.warning(
            "MONGODB_URI not set. Falling back to default local MongoDB instance."
        )

    try:
        _client = AsyncIOMotorClient(uri)
        database = _resolve_database(_client)
        await init_beanie(database=database, document_models=DOCUMENT_MODELS)
        logger.info("MongoDB connection established")
    except Exception:
        _client = None
        logger.exception("Failed to connect to MongoDB")
        raise

    return _client


async def disconnect_from_database() -> None:
    global _client
    if _client is None:
        return

    _client.close()
    _client = None

