from __future__ import annotations

from typing import Literal, Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, Field, field_validator

from .base import TimeStampedDocument


class ShippingAddress(BaseModel):
    name: str
    phone: Optional[str] = None
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postalCode: str
    country: str = Field(default="IN")


class Order(TimeStampedDocument):
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    cart: Optional[PydanticObjectId] = None
    totalAmount: float = Field(ge=0)
    currency: str = Field(default="INR")
    status: Literal[
        "pending_payment",
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
    ] = "pending_payment"
    shippingAddress: ShippingAddress
    paymentIntentId: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "orders"
        use_revision = False

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()
