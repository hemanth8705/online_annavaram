from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from beanie.odm.fields import PydanticObjectId
from fastapi import HTTPException, status

from ..models import Order, OrderItem, Payment, Product, User
from ..services.cartService import (
    buildCartSnapshot,
    clearCart,
    getOrCreateActiveCart,
    verifyStockLevels,
)
from ..services.paymentService import (
    PaymentServiceError,
    createRazorpayOrder,
    isConfigured,
)


def _ensure_object_id(value: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid identifier")


def _serialize_order(order: Order, user: Optional[User] = None) -> Dict[str, Any]:
    payload = order.model_dump()
    payload["id"] = str(order.id)
    payload["user"] = {
        "id": str(user.id) if user else str(order.user),
        "fullName": user.fullName if user else None,
        "email": user.email if user else None,
    }
    return payload


def _serialize_payment(payment: Payment) -> Dict[str, Any]:
    payload = payment.model_dump()
    payload["id"] = str(payment.id)
    payload["order"] = str(payment.order)
    return payload


async def createOrder(*, user: User, shippingAddress: Dict[str, Any], notes: Optional[str]):
    cart = await getOrCreateActiveCart(user.id)
    snapshot = await buildCartSnapshot(cart.id)
    if not snapshot["items"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    try:
        await verifyStockLevels(snapshot["items"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    total_amount = snapshot["totals"]["amount"]
    order_status = "pending_payment" if isConfigured() else "paid"

    order = Order(
        user=user.id,
        cart=cart.id,
        totalAmount=total_amount,
        currency="INR",
        status=order_status,
        shippingAddress=shippingAddress,
        paymentIntentId=None,
        notes=notes,
    )
    await order.insert()

    order_items_payload: List[Dict[str, Any]] = []
    for item in snapshot["items"]:
        order_items_payload.append(
            {
                "order": order.id,
                "product": PydanticObjectId(item["productId"]),
                "productName": item["name"],
                "unitPrice": item["unitPrice"],
                "quantity": item["quantity"],
                "subtotal": item["subtotal"],
            }
        )
    await OrderItem.insert_many([OrderItem(**payload) for payload in order_items_payload])

    for item in snapshot["items"]:
        await Product.find(Product.id == PydanticObjectId(item["productId"])).update(
            {"$inc": {"stock": -item["quantity"]}}
        )

    razorpay_order = None
    if isConfigured():
        try:
            razorpay_order = await createRazorpayOrder(
                amount=int(total_amount),
                currency="INR",
                receipt=str(order.id),
                notes={"userId": str(user.id)},
            )
            order.paymentIntentId = razorpay_order["id"]
            await order.save()
        except (PaymentServiceError, Exception) as exc:
            await Order.find(Order.id == order.id).delete()
            await OrderItem.find(OrderItem.order == order.id).delete()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to initiate payment. Please try again later.",
            ) from exc

    payment = Payment(
        order=order.id,
        gateway="razorpay" if isConfigured() else "manual",
        amount=total_amount,
        currency="INR",
        status="initiated" if isConfigured() else "captured",
        transactionId=None if isConfigured() else "offline",
        rawResponse=razorpay_order,
    )
    await payment.insert()

    await clearCart(cart.id)

    order_payload = _serialize_order(order, user)
    items_payload = order_items_payload
    payment_payload = _serialize_payment(payment)

    return {
        "success": True,
        "data": {
            "order": order_payload,
            "items": items_payload,
            "payment": payment_payload,
            "razorpay": (
                {
                    "orderId": razorpay_order["id"],
                    "amount": razorpay_order["amount"],
                    "currency": razorpay_order["currency"],
                    "keyId": os.getenv("RAZORPAY_KEY_ID"),
                    "name": "Online Annavaram",
                    "description": f"Temple pantry order {order_payload['id']}",
                }
                if razorpay_order
                else None
            ),
        },
    }


async def listOrders(*, user: User):
    orders = await Order.find(Order.user == user.id).sort("-createdAt").to_list()
    return {"success": True, "data": [_serialize_order(order, user) for order in orders]}


async def getOrder(*, user: User, orderId: str):
    object_id = _ensure_object_id(orderId)
    order = await Order.find_one(Order.id == object_id, Order.user == user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    items = await OrderItem.find(OrderItem.order == order.id).to_list()
    items_payload = [item.model_dump() | {"id": str(item.id), "order": str(item.order)} for item in items]
    return {"success": True, "data": {"order": _serialize_order(order, user), "items": items_payload}}


async def listAllOrders():
    orders = await Order.find_all().sort("-createdAt").to_list()
    return {"success": True, "data": [_serialize_order(order) for order in orders]}
