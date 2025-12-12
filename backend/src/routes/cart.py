from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..controllers import cartController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class AddItemPayload(BaseModel):
    productId: str
    quantity: int = Field(..., gt=0)


class UpdateItemPayload(BaseModel):
    quantity: int = Field(..., ge=0)


@router.get("/", include_in_schema=True)
@router.get("", include_in_schema=False)
async def get_cart(user: User = Depends(authenticate)):
    return await cartController.getCart(user=user)


@router.post("/items")
async def add_item(payload: AddItemPayload, user: User = Depends(authenticate)):
    return await cartController.addItem(user=user, productId=payload.productId, quantity=payload.quantity)


@router.patch("/items/{item_id}")
async def update_item(item_id: str, payload: UpdateItemPayload, user: User = Depends(authenticate)):
    return await cartController.updateItem(user=user, itemId=item_id, quantity=payload.quantity)


@router.delete("/items/{item_id}")
async def remove_item(item_id: str, user: User = Depends(authenticate)):
    return await cartController.removeItem(user=user, itemId=item_id)
