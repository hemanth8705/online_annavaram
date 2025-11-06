from __future__ import annotations

from typing import Literal, Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import Field, field_validator

from .base import TimeStampedDocument


class Payment(TimeStampedDocument):
    order: Indexed(PydanticObjectId)  # type: ignore[assignment]
    gateway: str
    amount: float = Field(ge=0)
    currency: str = Field(default="INR")
    status: Literal["initiated", "authorized", "captured", "failed", "refunded"] = (
        "initiated"
    )
    transactionId: Optional[str] = None
    rawResponse: Optional[dict] = None

    class Settings:
        name = "payments"
        use_revision = False

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("gateway", mode="before")
    @classmethod
    def normalize_gateway(cls, value: str) -> str:
        return value.lower()

