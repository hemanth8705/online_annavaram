from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from ..controllers import paymentController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class RazorpayVerifyPayload(BaseModel):
    orderId: str
    paymentId: str
    signature: str
    razorpayOrderId: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)


@router.post("/razorpay/verify")
async def verify_razorpay_payment(
    payload: RazorpayVerifyPayload,
    user: User = Depends(authenticate),
):
    return await paymentController.verifyRazorpayPayment(
        user=user,
        orderId=payload.orderId,
        paymentId=payload.paymentId,
        signature=payload.signature,
        razorpayOrderId=payload.razorpayOrderId,
        payload=payload.payload,
    )


@router.post("/razorpay/webhook", include_in_schema=False)
async def razorpay_webhook(request: Request):
    return await paymentController.handleRazorpayWebhook(request=request)
