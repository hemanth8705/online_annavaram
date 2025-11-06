from __future__ import annotations

from typing import Any, Dict

from beanie.odm.fields import PydanticObjectId
from fastapi import HTTPException, status

from ..models import Order, Payment, User
from ..services.paymentService import PaymentServiceError, verifyRazorpaySignature


async def verifyRazorpayPayment(*, user: User, orderId: str, paymentId: str, signature: str, payload: Dict[str, Any]):
    order_object_id = PydanticObjectId(orderId)
    order = await Order.find_one(Order.id == order_object_id, Order.user == user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    payment = await Payment.find_one(Payment.order == order.id, Payment.gateway == "razorpay")
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    try:
        valid = verifyRazorpaySignature(orderId=orderId, paymentId=paymentId, signature=signature)
    except PaymentServiceError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    payment.status = "captured"
    payment.transactionId = paymentId
    payment.rawResponse = payload
    await payment.save()

    order.status = "paid"
    await order.save()

    return {"success": True, "message": "Payment verified successfully."}
