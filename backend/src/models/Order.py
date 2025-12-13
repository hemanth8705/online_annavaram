from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, Field, field_validator, model_validator

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


class OrderItem(BaseModel):
    productId: Optional[PydanticObjectId] = None
    product: Optional[PydanticObjectId] = None
    productName: str
    quantity: int = Field(ge=1)
    unitPrice: float = Field(ge=0)
    subtotal: float = Field(ge=0)


class StatusHistoryEntry(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    updatedBy: Optional[PydanticObjectId] = None
    notes: Optional[str] = None


class Order(TimeStampedDocument):
    # Support both naming conventions for order ID
    orderId: Optional[str] = Field(default=None, unique=True, index=True)
    
    # Support both naming conventions for user reference
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    userId: Optional[PydanticObjectId] = None
    
    # Order items - support both embedded and referenced approaches
    products: List[OrderItem] = Field(default_factory=list)
    items: Optional[List[OrderItem]] = Field(default_factory=list)
    
    cart: Optional[PydanticObjectId] = None
    totalAmount: float = Field(ge=0)
    currency: str = Field(default="INR")
    
    # Extended status enum to support both backends
    status: Literal[
        "pending_payment",
        "pending",
        "paid",
        "order_created",
        "payment_confirmed",
        "dispatched",
        "shipped",
        "reached_city",
        "out_for_delivery",
        "delivered",
        "cancelled",
    ] = Field(default="order_created", index=True)
    
    statusHistory: List[StatusHistoryEntry] = Field(default_factory=list)
    shippingAddress: ShippingAddress
    paymentIntentId: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def sync_fields(self) -> "Order":
        # Sync user fields
        if self.userId is None:
            self.userId = self.user
        
        # Sync items fields
        if self.products and (not self.items or len(self.items) == 0):
            self.items = self.products
        elif self.items and (not self.products or len(self.products) == 0):
            self.products = self.items
        
        # Sync product/productId in items
        for item in self.products:
            if item.productId and not item.product:
                item.product = item.productId
            elif item.product and not item.productId:
                item.productId = item.product
        
        # Initialize status history if needed
        if not self.statusHistory:
            self.statusHistory.append(
                StatusHistoryEntry(status=self.status, timestamp=self.createdAt or datetime.now())
            )
        
        return self

    class Settings:
        name = "orders"
        use_revision = False
