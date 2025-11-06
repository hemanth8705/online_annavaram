from __future__ import annotations

import hashlib
import hmac
import asyncio
import os
from typing import Any, Dict, Optional

import razorpay

_razorpay_client: Optional[razorpay.Client] = None


class PaymentServiceError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def isConfigured() -> bool:
    return bool(os.getenv("RAZORPAY_KEY_ID") and os.getenv("RAZORPAY_SECRET"))


def getClient() -> razorpay.Client:
    global _razorpay_client
    if not isConfigured():
        raise PaymentServiceError("Razorpay credentials are not configured", status=500)
    if _razorpay_client is None:
        _razorpay_client = razorpay.Client(
            auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_SECRET"))
        )
    return _razorpay_client


async def createRazorpayOrder(*, amount: int, currency: str = "INR", receipt: Optional[str] = None, notes: Optional[Dict[str, Any]] = None):
    client = getClient()
    payload = {"amount": amount, "currency": currency, "receipt": receipt, "notes": notes or {}}
    return await asyncio.to_thread(client.order.create, payload)


def verifyRazorpaySignature(*, orderId: str, paymentId: str, signature: str) -> bool:
    secret = os.getenv("RAZORPAY_SECRET")
    if not secret:
        raise PaymentServiceError("Razorpay secret is not configured", status=500)
    payload = f"{orderId}|{paymentId}".encode("utf-8")
    expected_signature = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return expected_signature == signature
