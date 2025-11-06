from __future__ import annotations

from datetime import datetime
from typing import Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pymongo import IndexModel

from .base import TimeStampedDocument


class Session(TimeStampedDocument):
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    refreshTokenHash: Indexed(str, unique=True)  # type: ignore[assignment]
    expiresAt: datetime
    revokedAt: Optional[datetime] = None
    userAgent: Optional[str] = None
    ipAddress: Optional[str] = None
    metadata: Optional[dict] = None

    class Settings:
        name = "sessions"
        use_revision = False
        indexes = [
            IndexModel(
                [("expiresAt", 1)],
                expireAfterSeconds=0,
                partialFilterExpression={"revokedAt": None},
            )
        ]

