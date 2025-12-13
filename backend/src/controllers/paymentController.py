from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from beanie.odm.fields import PydanticObjectId
from fastapi import HTTPException, Request, status

from ..models import Cart, Order, OrderItem, Payment, Product, User
from ..services.cartService import clearCart
from ..services.paymentService import (
    PaymentServiceError,
    verifyRazorpaySignature,
    verifyRazorpayWebhookSignature,
)

logger = logging.getLogger("payments")


def _serialize_order(order: Order, user: User) -> Dict[str, Any]:
    payload = order.model_dump()
    payload["_id"] = payload.get("_id") or str(order.id)
    payload["id"] = str(order.id)
    payload["user"] = str(user.id)
    return payload


def _serialize_payment(payment: Payment) -> Dict[str, Any]:
    payload = payment.model_dump()
    payload["_id"] = payload.get("_id") or str(payment.id)
    payload["id"] = str(payment.id)
    payload["order"] = str(payment.order)
    return payload


def _serialize_items(items: list[OrderItem]) -> list[Dict[str, Any]]:
    serialized = []
    for item in items:
        data = item.model_dump()
        data["_id"] = data.get("_id") or str(item.id)
        data["id"] = str(item.id)
        data["order"] = str(item.order)
        if "product" in data:
            data["product"] = str(data["product"])
        serialized.append(data)
    return serialized


async def verifyRazorpayPayment(
    *,
    user: User,
    orderId: str,
    paymentId: str,
    signature: str,
    payload: Dict[str, Any],
    razorpayOrderId: Optional[str] = None,
):
    logger.info(
        "Verify Razorpay payment called",
        extra={
            "orderId": orderId,
            "userId": str(user.id),
            "paymentId": paymentId,
            "razorpayOrderId": razorpayOrderId,
        },
    )
    print(f"[payments] verify called orderId={orderId} user={user.id} paymentId={paymentId} rp_order={razorpayOrderId}")
    try:
        order_object_id = PydanticObjectId(orderId)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order identifier")

    order = await Order.find_one(Order.id == order_object_id, Order.user == user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    payment = await Payment.find_one(Payment.order == order.id, Payment.gateway == "razorpay")
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    gateway_order_id = razorpayOrderId or order.paymentIntentId or (payment.rawResponse or {}).get("id")
    if not gateway_order_id:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment was not initiated for this order")

    gateway_order_id = str(gateway_order_id)

    if order.paymentIntentId and order.paymentIntentId != gateway_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment reference mismatch")

    if payment.status == "captured" and payment.transactionId:
        items = await OrderItem.find(OrderItem.order == order.id).to_list()
        logger.info(
            "Razorpay payment already captured",
            extra={
                "orderId": str(order.id),
                "userId": str(user.id),
                "paymentId": payment.transactionId,
            },
        )
        print(f"[payments] already captured order={order.id} paymentId={payment.transactionId}")
        return {
            "success": True,
            "message": "Payment already verified.",
            "data": {
                "order": _serialize_order(order, user),
                "payment": _serialize_payment(payment),
                "items": _serialize_items(items),
            },
        }

    try:
        valid = verifyRazorpaySignature(razorpayOrderId=gateway_order_id, paymentId=paymentId, signature=signature)
    except PaymentServiceError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    if not valid:
        logger.warning(
            "Invalid Razorpay signature",
            extra={
                "orderId": str(order.id),
                "userId": str(user.id),
                "paymentId": paymentId,
                "razorpayOrderId": gateway_order_id,
            },
        )
        print(f"[payments] invalid signature order={order.id} paymentId={paymentId} rp_order={gateway_order_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    payment.status = "captured"
    payment.transactionId = paymentId
    merged_raw_response: Dict[str, Any] = payment.rawResponse or {}
    merged_raw_response["verificationPayload"] = payload
    payment.rawResponse = merged_raw_response
    await payment.save()

    order.status = "paid"
    await order.save()

    items = await OrderItem.find(OrderItem.order == order.id).to_list()

    # Deduct stock from products after successful payment
    for item in items:
        product = await Product.find_one(Product.id == item.product)
        if product:
            # Ensure stock doesn't go negative
            new_stock = max(0, product.stock - item.quantity)
            product.stock = new_stock
            await product.save()
            logger.info(
                "Stock deducted after payment",
                extra={
                    "productId": str(product.id),
                    "productName": product.name,
                    "quantityDeducted": item.quantity,
                    "newStock": new_stock,
                    "orderId": str(order.id),
                },
            )
            print(f"[payments] stock deducted product={product.id} qty={item.quantity} newStock={new_stock}")

    # Clear the user's cart after successful payment verification
    cart = await Cart.find_one(Cart.user == user.id)
    if cart:
        await clearCart(cart.id)
        logger.info(
            "Cart cleared after payment verification",
            extra={"userId": str(user.id), "cartId": str(cart.id)},
        )

    logger.info(
        "Payment verified",
        extra={
            "orderId": str(order.id),
            "userId": str(user.id),
            "paymentId": paymentId,
            "razorpayOrderId": gateway_order_id,
        },
    )
    print(f"[payments] payment verified order={order.id} paymentId={paymentId} rp_order={gateway_order_id}")

    return {
        "success": True,
        "message": "Payment verified successfully.",
        "data": {
            "order": _serialize_order(order, user),
            "payment": _serialize_payment(payment),
            "items": _serialize_items(items),
        },
    }


def _append_webhook_event(payment: Payment, event_name: str, event_payload: Dict[str, Any]) -> None:
    raw: Dict[str, Any] = payment.rawResponse or {}
    events = raw.get("webhookEvents") or []
    events.append({"event": event_name, "payload": event_payload})
    raw["webhookEvents"] = events
    payment.rawResponse = raw


async def handleRazorpayWebhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    try:
        is_valid = verifyRazorpayWebhookSignature(raw_body=raw_body, signature=signature)
    except PaymentServiceError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    payload = await request.json()
    event_name: str = payload.get("event") or ""
    event_payload: Dict[str, Any] = payload.get("payload") or {}

    if not event_name:
        return {"success": False, "message": "Missing event name"}

    logger.info(
        "Razorpay webhook received",
        extra={
            "event": event_name,
            "signaturePresent": bool(signature),
        },
    )
    print(f"[payments] webhook received event={event_name} signature_present={bool(signature)}")

    # Handle payment.* events
    if event_name.startswith("payment."):
        payment_entity: Dict[str, Any] = (event_payload.get("payment") or {}).get("entity") or {}
        razorpay_order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")
        status_value = payment_entity.get("status")

        if not razorpay_order_id:
            return {"success": False, "message": "No order reference on payment event"}

        order = await Order.find_one(Order.paymentIntentId == razorpay_order_id)
        if not order:
            logger.warning(
                "Payment event with no matching order",
                extra={"event": event_name, "razorpayOrderId": razorpay_order_id, "paymentId": payment_id},
            )
            return {"success": True, "message": "Order not found for payment event (acknowledged to stop retries)"}

        payment = await Payment.find_one(Payment.order == order.id, Payment.gateway == "razorpay")
        if not payment:
            payment = Payment(
                order=order.id,
                gateway="razorpay",
                amount=order.totalAmount,
                currency=order.currency,
                status="initiated",
                transactionId=payment_id,
                rawResponse={},
            )
            await payment.insert()

        if status_value in {"authorized", "captured", "failed", "refunded"}:
            payment.status = status_value  # type: ignore[assignment]

        payment.transactionId = payment_id or payment.transactionId
        _append_webhook_event(payment, event_name, payment_entity)
        await payment.save()

        if status_value == "captured":
            order.status = "paid"
            await order.save()
            
            # Clear the user's cart after successful payment via webhook
            user = await User.get(order.user)
            if user:
                cart = await Cart.find_one(Cart.user == user.id)
                if cart:
                    await clearCart(cart.id)
                    logger.info(
                        "Cart cleared after webhook payment capture",
                        extra={"userId": str(user.id), "cartId": str(cart.id), "orderId": str(order.id)},
                    )
        elif status_value == "failed":
            order.status = "pending_payment"
            await order.save()

        logger.info(
            "Razorpay payment event processed",
            extra={
                "event": event_name,
                "orderId": str(order.id),
                "paymentId": payment.transactionId,
                "status": payment.status,
            },
        )
        print(f"[payments] payment event processed event={event_name} order={order.id} paymentId={payment.transactionId} status={payment.status}")

        return {"success": True, "message": f"Processed {event_name}", "data": {"orderId": str(order.id)}}

    # Handle order.* events
    if event_name.startswith("order."):
        order_entity: Dict[str, Any] = (event_payload.get("order") or {}).get("entity") or {}
        razorpay_order_id = order_entity.get("id")
        if not razorpay_order_id:
            return {"success": False, "message": "No order id on order event"}

        order = await Order.find_one(Order.paymentIntentId == razorpay_order_id)
        if not order:
            logger.warning(
                "Order event with no matching order",
                extra={"event": event_name, "razorpayOrderId": razorpay_order_id},
            )
            return {"success": True, "message": "Order not found for order event (acknowledged)"}

        payment = await Payment.find_one(Payment.order == order.id, Payment.gateway == "razorpay")
        if not payment:
            payment = Payment(
                order=order.id,
                gateway="razorpay",
                amount=order.totalAmount,
                currency=order.currency,
                status="initiated",
                rawResponse={},
            )
            await payment.insert()

        if event_name == "order.paid":
            payment.status = "captured"
            _append_webhook_event(payment, event_name, order_entity)
            await payment.save()

            order.status = "paid"
            await order.save()
            
            # Clear the user's cart after successful payment via webhook
            user = await User.get(order.user)
            if user:
                cart = await Cart.find_one(Cart.user == user.id)
                if cart:
                    await clearCart(cart.id)
                    logger.info(
                        "Cart cleared after order.paid webhook",
                        extra={"userId": str(user.id), "cartId": str(cart.id), "orderId": str(order.id)},
                    )
            
            logger.info(
                "Razorpay order paid event processed",
                extra={
                    "event": event_name,
                    "orderId": str(order.id),
                    "paymentId": payment.transactionId,
                },
            )
            print(f"[payments] order paid event processed order={order.id} paymentId={payment.transactionId}")
            return {"success": True, "message": "Order marked as paid", "data": {"orderId": str(order.id)}}

        _append_webhook_event(payment, event_name, order_entity)
        await payment.save()
        logger.info(
            "Razorpay order event acknowledged",
            extra={
                "event": event_name,
                "orderId": str(order.id),
            },
        )
        print(f"[payments] order event acknowledged event={event_name} order={order.id}")
        return {"success": True, "message": f"Acknowledged {event_name}", "data": {"orderId": str(order.id)}}

    return {"success": True, "message": f"Ignored event {event_name}"}
