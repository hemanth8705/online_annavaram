from __future__ import annotations

from typing import Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field

from .base import TimeStampedDocument


class Review(TimeStampedDocument):
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    product: Indexed(PydanticObjectId)  # type: ignore[assignment]
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    title: Optional[str] = Field(default=None, max_length=100)
    comment: Optional[str] = Field(default=None, max_length=1000)
    isVerifiedPurchase: bool = False
    isApproved: bool = True  # Admin can moderate reviews
    helpfulCount: int = Field(default=0, ge=0)

    class Settings:
        name = "reviews"
        use_revision = False
        indexes = [
            [("product", 1), ("user", 1)],  # Unique review per user per product
            [("product", 1), ("createdAt", -1)],  # Sort by recent for product
            [("user", 1), ("createdAt", -1)],  # Sort by recent for user
        ]
