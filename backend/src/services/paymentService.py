from __future__ import annotations

import hmac
import hashlib
import asyncio
import os
from typing import Any, Dict, Optional

import razorpay

_razorpay_client: Optional[razorpay.Client] = None


class PaymentServiceError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _get_credentials() -> tuple[Optional[str], Optional[str]]:
    key_id = os.getenv("RAZORPAY_KEY_ID")
    # Accept both the canonical KEY_SECRET name and the older SECRET env for compatibility
    key_secret = os.getenv("RAZORPAY_KEY_SECRET") or os.getenv("RAZORPAY_SECRET")
    return key_id, key_secret


def _get_webhook_secret() -> Optional[str]:
    return os.getenv("RAZORPAY_WEBHOOK_SECRET")


def isConfigured() -> bool:
    key_id, key_secret = _get_credentials()
    return bool(key_id and key_secret)


def getClient() -> razorpay.Client:
    global _razorpay_client
    if not isConfigured():
        raise PaymentServiceError("Razorpay credentials are not configured", status=500)
    if _razorpay_client is None:
        key_id, key_secret = _get_credentials()
        _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
    return _razorpay_client


async def createRazorpayOrder(
    *,
    amount: int,
    currency: str = "INR",
    receipt: Optional[str] = None,
    notes: Optional[Dict[str, Any]] = None,
    capture: bool = True,
):
    client = getClient()
    payload = {
        "amount": amount,
        "currency": currency,
        "receipt": receipt,
        "notes": notes or {},
        # Explicitly set capture mode so live payments auto-capture unless configured otherwise
        "payment_capture": 1 if capture else 0,
    }
    return await asyncio.to_thread(client.order.create, payload)


def verifyRazorpaySignature(*, razorpayOrderId: str, paymentId: str, signature: str) -> bool:
    _, key_secret = _get_credentials()
    if not key_secret:
        raise PaymentServiceError("Razorpay secret is not configured", status=500)
    payload = f"{razorpayOrderId}|{paymentId}".encode("utf-8")
    expected_signature = hmac.new(key_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return expected_signature == signature


def verifyRazorpayWebhookSignature(*, raw_body: bytes, signature: Optional[str]) -> bool:
    secret = _get_webhook_secret()
    if not secret:
        raise PaymentServiceError("Razorpay webhook secret is not configured", status=500)
    if not signature:
        raise PaymentServiceError("Missing Razorpay webhook signature", status=400)
    computed = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature)
