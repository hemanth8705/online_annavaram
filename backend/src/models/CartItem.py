from __future__ import annotations

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from .base import TimeStampedDocument


class CartItem(TimeStampedDocument):
    cart: Indexed(PydanticObjectId)  # type: ignore[assignment]
    product: Indexed(PydanticObjectId)  # type: ignore[assignment]
    quantity: int = Field(default=1, ge=1)
    priceAtAddition: float = Field(ge=0)

    class Settings:
        name = "cart_items"
        use_revision = False
        indexes = [IndexModel([("cart", 1), ("product", 1)], unique=True)]
