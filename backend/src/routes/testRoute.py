from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from ..db import _client as db_client  # type: ignore[attr-defined]

router = APIRouter()


@router.get("/")
async def test_endpoint():
    status = "connected" if db_client is not None else "disconnected"
    return {
        "message": "Test endpoint is working",
        "database": status,
        "timestamp": datetime.utcnow().isoformat(),
    }
