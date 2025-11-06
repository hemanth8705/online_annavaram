from __future__ import annotations

import os
import random
from datetime import datetime, timedelta, timezone
from typing import Iterable, List

from passlib.hash import bcrypt

from ..models import User

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
OTP_MAX_PER_DAY = int(os.getenv("OTP_MAX_PER_DAY", "3"))

SUPPORTED_BUCKETS = {"emailVerification", "passwordReset"}


class OtpServiceError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _ensure_bucket(user: User, bucket_key: str):
    if bucket_key not in SUPPORTED_BUCKETS:
        raise OtpServiceError(f"Unsupported OTP bucket: {bucket_key}", status=500)
    bucket = getattr(user, bucket_key, None)
    if bucket is None:
        bucket = user.model_fields[bucket_key].default_factory()  # type: ignore[attr-defined]
    bucket.attempts = bucket.attempts or 0
    bucket.sentHistory = list(bucket.sentHistory or [])
    setattr(user, bucket_key, bucket)
    return bucket


def _generate_otp() -> str:
    start = 10 ** (OTP_LENGTH - 1)
    end = 10 ** OTP_LENGTH - 1
    return f"{random.randint(start, end)}"


def _purge_history(history: Iterable[datetime]) -> List[datetime]:
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=1)
    return [entry for entry in history if entry > cutoff]


async def assignOtp(user: User, bucketKey: str = "emailVerification"):
    bucket = _ensure_bucket(user, bucketKey)
    history = _purge_history(bucket.sentHistory)
    if len(history) >= OTP_MAX_PER_DAY:
        raise OtpServiceError("OTP request limit reached. Try again later.", status=429)

    otp = _generate_otp()
    otp_hash = bcrypt.hash(otp)
    now = datetime.now(tz=timezone.utc)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    bucket.otpHash = otp_hash
    bucket.otpExpiresAt = expires_at
    bucket.attempts = 0
    bucket.sentHistory = history + [now]
    setattr(user, bucketKey, bucket)

    return {"otp": otp, "expiresAt": expires_at}


async def verifyOtp(user: User, bucketKey: str, otp: str) -> bool:
    bucket = _ensure_bucket(user, bucketKey)

    if not bucket.otpHash:
        raise OtpServiceError("No OTP request found. Please request a new code.")

    if bucket.attempts >= OTP_MAX_ATTEMPTS:
        raise OtpServiceError("Maximum OTP attempts exceeded. Request a new code.", status=429)

    if not bucket.otpExpiresAt or bucket.otpExpiresAt < datetime.now(tz=timezone.utc):
        raise OtpServiceError("OTP has expired. Request a new code.")

    if not bcrypt.verify(otp, bucket.otpHash):
        bucket.attempts += 1
        setattr(user, bucketKey, bucket)
        await user.save()
        raise OtpServiceError("Invalid OTP. Please try again.")

    bucket.otpHash = None
    bucket.otpExpiresAt = None
    bucket.attempts = 0
    bucket.sentHistory = _purge_history(bucket.sentHistory)
    setattr(user, bucketKey, bucket)
    await user.save()
    return True
