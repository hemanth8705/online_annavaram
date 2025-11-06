from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..controllers import paymentController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class RazorpayVerifyPayload(BaseModel):
    orderId: str
    paymentId: str
    signature: str
    payload: Dict[str, Any] = {}


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
        payload=payload.payload,
    )
