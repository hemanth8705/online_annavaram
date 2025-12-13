from __future__ import annotations

from typing import Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field, model_validator

from .base import TimeStampedDocument


class Review(TimeStampedDocument):
    # Support both naming conventions
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    userId: Optional[PydanticObjectId] = None
    
    product: Indexed(PydanticObjectId)  # type: ignore[assignment]
    productId: Optional[PydanticObjectId] = None
    
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    title: Optional[str] = Field(default=None, max_length=100)
    
    # Support both naming conventions for review text
    comment: Optional[str] = Field(default=None, max_length=1000)
    reviewText: Optional[str] = Field(default=None, max_length=1000)
    
    isVerifiedPurchase: bool = False
    isApproved: bool = Field(default=True, index=True)  # Admin can moderate reviews
    isDeleted: bool = False
    helpfulCount: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def sync_fields(self) -> "Review":
        # Sync user fields
        if self.userId is None:
            self.userId = self.user
        
        # Sync product fields
        if self.productId is None:
            self.productId = self.product
        
        # Sync comment and reviewText
        if self.comment and not self.reviewText:
            self.reviewText = self.comment
        elif self.reviewText and not self.comment:
            self.comment = self.reviewText
            
        return self

    class Settings:
        name = "reviews"
        use_revision = False
        indexes = [
            [("product", 1), ("user", 1)],  # Unique review per user per product
            [("productId", 1), ("userId", 1)],  # Alternative naming
            [("product", 1), ("createdAt", -1)],  # Sort by recent for product
            [("user", 1), ("createdAt", -1)],  # Sort by recent for user
            [("isApproved", 1)],  # Filter by approval status
        ]
