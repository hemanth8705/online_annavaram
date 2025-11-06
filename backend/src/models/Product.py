from __future__ import annotations

from typing import List, Optional

from beanie import Indexed
from pydantic import Field, field_validator

from .base import TimeStampedDocument


class Product(TimeStampedDocument):
    name: str
    slug: Indexed(str, unique=True)  # type: ignore[assignment]
    description: Optional[str] = None
    price: float = Field(ge=0)
    currency: str = Field(default="INR")
    stock: int = Field(default=0, ge=0)
    category: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    isActive: bool = True

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.lower()

    class Settings:
        name = "products"
        use_revision = False
