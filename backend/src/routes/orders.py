from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from ..controllers import orderController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class ShippingAddress(BaseModel):
    name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postalCode: str
    country: str = Field(default="IN")
    phone: Optional[str] = None

    @field_validator("country", mode="before")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper()


class CreateOrderPayload(BaseModel):
    shippingAddress: ShippingAddress
    notes: Optional[str] = None


@router.post("/")
async def create_order(payload: CreateOrderPayload, user: User = Depends(authenticate)):
    return await orderController.createOrder(
        user=user,
        shippingAddress=payload.shippingAddress.model_dump(),
        notes=payload.notes,
    )


@router.get("/")
async def list_orders(user: User = Depends(authenticate)):
    return await orderController.listOrders(user=user)


@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(authenticate)):
    return await orderController.getOrder(user=user, orderId=order_id)


@router.delete("/{order_id}")
async def delete_order(order_id: str, user: User = Depends(authenticate)):
    """Delete an order from history"""
    return await orderController.deleteOrder(user=user, orderId=order_id)
