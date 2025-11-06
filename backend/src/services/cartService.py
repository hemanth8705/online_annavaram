from __future__ import annotations

from typing import Iterable, List

from beanie.odm.fields import PydanticObjectId

from ..models import Cart, CartItem, Product


async def getOrCreateActiveCart(user_id: PydanticObjectId) -> Cart:
    cart = await Cart.find_one(Cart.user == user_id, Cart.status == "active")
    if cart:
        return cart
    cart = Cart(user=user_id, status="active")
    await cart.insert()
    return cart


async def buildCartSnapshot(cart_id: PydanticObjectId):
    items = await CartItem.find(CartItem.cart == cart_id).to_list()
    formatted_items = []
    for item in items:
        product = await Product.get(item.product)
        product_data = product.dict() if product else {}
        formatted_items.append(
            {
                "id": str(item.id),
                "productId": str(item.product),
                "name": product.name if product else None,
                "quantity": item.quantity,
                "unitPrice": item.priceAtAddition,
                "subtotal": item.priceAtAddition * item.quantity,
                "productSnapshot": {
                    "slug": product.slug if product else None,
                    "stock": product.stock if product else None,
                    "isActive": product.isActive if product else None,
                    "category": product.category if product else None,
                    "images": product.images if product else [],
                },
            }
        )

    totals = {"quantity": 0, "amount": 0}
    for item in formatted_items:
        totals["quantity"] += item["quantity"]
        totals["amount"] += item["subtotal"]

    return {"items": formatted_items, "totals": totals}


async def clearCart(cart_id: PydanticObjectId):
    await CartItem.find(CartItem.cart == cart_id).delete()
    await Cart.find(Cart.id == cart_id).update({"$set": {"status": "converted"}})


async def verifyStockLevels(cart_items: Iterable[dict]):
    for item in cart_items:
        product_id = item.get("productId") or item.get("product")
        product = await Product.get(product_id)
        if not product or not product.isActive:
            raise ValueError("Product not available")
        if product.stock < item.get("quantity", 0):
            raise ValueError(f"Insufficient stock for {product.name}")

