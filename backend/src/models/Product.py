from __future__ import annotations

from typing import List, Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field, field_validator, model_validator

from .base import TimeStampedDocument


class Product(TimeStampedDocument):
    name: str = Field(index=True)
    slug: Indexed(str, unique=True)  # type: ignore[assignment]
    description: Optional[str] = None
    
    # Category references - support both formats
    categoryId: Optional[PydanticObjectId] = Field(default=None, index=True)
    category: Optional[str] = None  # Can be category name or ID
    
    # Pricing
    price: float = Field(ge=0)
    currency: str = Field(default="INR")
    
    # Stock management - support both naming conventions
    stock: int = Field(default=0, ge=0)
    totalStock: Optional[int] = Field(default=None, ge=0)
    maxUnitsPerUser: int = Field(default=1, ge=1)
    isUnlimitedPurchase: bool = False
    
    # Images - support both single and multiple
    imageUrl: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    
    # Status flags
    isActive: bool = Field(default=True, index=True)
    isDeleted: bool = False

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.lower()

    @model_validator(mode="after")
    def sync_fields(self) -> "Product":
        # Sync stock fields
        if self.totalStock is None:
            self.totalStock = self.stock
        elif self.stock != self.totalStock:
            self.stock = self.totalStock
        
        # Sync image fields
        if self.imageUrl and not self.images:
            self.images = [self.imageUrl]
        elif self.images and not self.imageUrl:
            self.imageUrl = self.images[0]
        
        # Auto-disable when out of stock
        if self.stock == 0 or self.totalStock == 0:
            self.isActive = False
            
        return self

    class Settings:
        name = "products"
        use_revision = False
