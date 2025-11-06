from __future__ import annotations

from typing import Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field, model_validator
from pymongo import IndexModel

from .base import TimeStampedDocument


class OrderItem(TimeStampedDocument):
    order: Indexed(PydanticObjectId)  # type: ignore[assignment]
    product: Indexed(PydanticObjectId)  # type: ignore[assignment]
    productName: str
    unitPrice: float = Field(ge=0)
    quantity: int = Field(default=1, ge=1)
    subtotal: Optional[float] = Field(default=None, ge=0)

    class Settings:
        name = "order_items"
        use_revision = False
        indexes = [IndexModel([("order", 1)]), IndexModel([("product", 1)])]

    @model_validator(mode="after")
    def ensure_subtotal(cls, model: "OrderItem") -> "OrderItem":
        if model.unitPrice is not None and model.quantity is not None:
            model.subtotal = round(model.unitPrice * model.quantity)
        return model
