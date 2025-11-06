from __future__ import annotations

from fastapi import HTTPException, status
from beanie.odm.fields import PydanticObjectId

from ..models import CartItem, Product, User
from ..services.cartService import (
    buildCartSnapshot,
    getOrCreateActiveCart,
)


def _invalid_object_id(object_id: str) -> bool:
    try:
        PydanticObjectId(object_id)
        return False
    except Exception:
        return True


async def getCart(*, user: User):
    cart = await getOrCreateActiveCart(user.id)
    snapshot = await buildCartSnapshot(cart.id)
    return {
        "success": True,
        "data": {
            "id": str(cart.id),
            "status": cart.status,
            **snapshot,
        },
    }


async def addItem(*, user: User, productId: str, quantity: int):
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    if quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")

    product = await Product.get(productId)
    if not product or not product.isActive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    if product.stock < quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock for requested quantity")

    cart = await getOrCreateActiveCart(user.id)
    existing_item = await CartItem.find_one(CartItem.cart == cart.id, CartItem.product == product.id)

    if existing_item:
        existing_item.quantity += quantity
        if existing_item.quantity <= 0:
            await existing_item.delete()
        else:
            await existing_item.save()
    else:
        item = CartItem(
            cart=cart.id,
            product=product.id,
            quantity=quantity,
            priceAtAddition=product.price,
        )
        await item.insert()

    snapshot = await buildCartSnapshot(cart.id)
    return {
        "success": True,
        "data": {
            "id": str(cart.id),
            "status": cart.status,
            **snapshot,
        },
    }


async def updateItem(*, user: User, itemId: str, quantity: int):
    if _invalid_object_id(itemId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cart item ID")

    cart = await getOrCreateActiveCart(user.id)
    item = await CartItem.find_one(CartItem.id == itemId, CartItem.cart == cart.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if quantity <= 0:
        await item.delete()
    else:
        product = await Product.get(item.product)
        if not product or not product.isActive:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not available")
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock for requested quantity")
        item.quantity = quantity
        await item.save()

    snapshot = await buildCartSnapshot(cart.id)
    return {
        "success": True,
        "data": {
            "id": str(cart.id),
            "status": cart.status,
            **snapshot,
        },
    }


async def removeItem(*, user: User, itemId: str):
    if _invalid_object_id(itemId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cart item ID")

    cart = await getOrCreateActiveCart(user.id)
    await CartItem.find_one(CartItem.id == itemId, CartItem.cart == cart.id).delete()

    snapshot = await buildCartSnapshot(cart.id)
    return {
        "success": True,
        "data": {
            "id": str(cart.id),
            "status": cart.status,
            **snapshot,
        },
    }
