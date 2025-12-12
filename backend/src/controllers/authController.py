from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, Request, Response, status
from passlib.context import CryptContext
import logging

from ..models import Session, User
from ..models.User import Address
from ..services.mailer import sendOtpEmail, sendPasswordResetEmail
from ..services.otpService import OTP_EXPIRY_MINUTES, assignOtp, verifyOtp, OtpServiceError
from ..services.sessionService import (
    SessionError,
    createSession,
    revokeAllUserSessions,
    revokeByRefreshToken,
    revokeSession,
    rotateSession,
)

password_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

REFRESH_COOKIE_NAME = "refreshToken"
REFRESH_COOKIE_SECURE = str(os.getenv("REFRESH_TOKEN_COOKIE_SECURE", "false")).lower() == "true"


def _normalize_cookie_expiry(expires_at: datetime) -> datetime:
    if expires_at.tzinfo is None:
        return expires_at.replace(tzinfo=timezone.utc)
    return expires_at.astimezone(timezone.utc)


def _get_refresh_cookie_options(expires_at: datetime):
    expires_at = _normalize_cookie_expiry(expires_at)
    is_secure = REFRESH_COOKIE_SECURE or os.getenv("NODE_ENV") == "production"
    same_site = "none" if is_secure else "lax"
    return dict(
        httponly=True,
        secure=is_secure,
        samesite=same_site,
        expires=expires_at,
        path="/api/auth",
    )


def _serialize_user(user: User) -> dict:
    addresses = []
    for idx, addr in enumerate(user.addresses or []):
        addr_id = getattr(addr, "id", None) or f"addr-{idx}"
        addr.id = addr_id  # type: ignore[attr-defined]
        addresses.append(
            {
                "id": addr_id,
                "label": getattr(addr, "label", None),
                "contactName": getattr(addr, "contactName", None),
                "phone": getattr(addr, "phone", None),
                "line1": addr.line1,
                "line2": addr.line2,
                "city": addr.city,
                "state": addr.state,
                "postalCode": addr.postalCode,
                "country": addr.country,
            }
        )

    return {
        "id": str(user.id),
        "fullName": user.fullName,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "emailVerified": user.emailVerified,
        "addresses": addresses,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "updatedAt": user.updatedAt.isoformat() if user.updatedAt else None,
    }


def _set_refresh_cookie(response: Response, token: str, expires_at: datetime):
    response.set_cookie(REFRESH_COOKIE_NAME, token, **_get_refresh_cookie_options(expires_at))


def _clear_refresh_cookie(response: Response):
    expired = datetime.now(tz=timezone.utc)
    response.delete_cookie(REFRESH_COOKIE_NAME, **_get_refresh_cookie_options(expired))


def _extract_refresh_token(request: Request, candidate: Optional[str] = None) -> Optional[str]:
    if candidate:
        return candidate
    cookie_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    header_token = request.headers.get("x-refresh-token")
    if header_token:
        return header_token
    return None


def _build_auth_response(*, user: User, access_token: str, access_expires: datetime, session: Session):
    return {
        "success": True,
        "message": "Authentication successful.",
        "data": {
            "accessToken": access_token,
            "accessTokenExpiresAt": access_expires.isoformat(),
            "session": {
                "id": str(session.id),
                "expiresAt": session.expiresAt.isoformat(),
                "createdAt": session.createdAt.isoformat() if session.createdAt else None,
                "updatedAt": session.updatedAt.isoformat() if session.updatedAt else None,
            },
            "user": _serialize_user(user),
        },
    }


def _find_address(user: User, address_id: str) -> Optional[Address]:
    for address in user.addresses:
        if getattr(address, "id", None) == address_id:
            return address
    return None


async def signup(*, fullName: str, email: str, password: str, phone: Optional[str], response: Response, background: BackgroundTasks):
    normalized_email = email.lower()
    existing = await User.find_one(User.email == normalized_email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists with this email.")

    password_hash = password_context.hash(password)
    user = User(
        fullName=fullName,
        email=normalized_email,
        passwordHash=password_hash,
        phone=phone,
        emailVerified=False,
    )
    await user.insert()

    otp_payload = await assignOtp(user, "emailVerification")
    await user.save()
    background.add_task(
        sendOtpEmail,
        to=user.email,
        otp=otp_payload["otp"],
        expiresMinutes=OTP_EXPIRY_MINUTES,
    )

    response.status_code = status.HTTP_201_CREATED
    return {
        "success": True,
        "message": "Signup successful. Please verify your email using the OTP sent to your inbox.",
    }


async def resendOtp(*, email: str, response: Response, background: BackgroundTasks):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    if user.emailVerified:
        return {"success": True, "message": "Email already verified."}

    otp_payload = await assignOtp(user, "emailVerification")
    await user.save()
    background.add_task(
        sendOtpEmail,
        to=user.email,
        otp=otp_payload["otp"],
        expiresMinutes=OTP_EXPIRY_MINUTES,
    )

    return {"success": True, "message": "OTP resent successfully."}


async def verifyEmail(*, email: str, otp: str, request: Request, response: Response):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    try:
        await verifyOtp(user, "emailVerification", otp)
    except OtpServiceError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    user.emailVerified = True
    user.emailVerifiedAt = datetime.now(tz=timezone.utc)
    await user.save()

    session_payload = await createSession(
        user=user,
        userAgent=request.headers.get("user-agent"),
        ipAddress=request.client.host if request.client else None,
        metadata={"source": "emailVerification"},
    )
    _set_refresh_cookie(response, session_payload["refreshToken"], session_payload["refreshTokenExpiresAt"])

    return {
        **_build_auth_response(
            user=user,
            access_token=session_payload["accessToken"],
            access_expires=session_payload["accessTokenExpiresAt"],
            session=session_payload["session"],
        ),
        "message": "Email verified successfully. You're now signed in.",
    }


async def login(*, email: str, password: str, request: Request, response: Response):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not password_context.verify(password, user.passwordHash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not user.emailVerified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before logging in.")
    if not user.isActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled.")

    session_payload = await createSession(
        user=user,
        userAgent=request.headers.get("user-agent"),
        ipAddress=request.client.host if request.client else None,
        metadata=None,
    )
    _set_refresh_cookie(response, session_payload["refreshToken"], session_payload["refreshTokenExpiresAt"])

    return _build_auth_response(
        user=user,
        access_token=session_payload["accessToken"],
        access_expires=session_payload["accessTokenExpiresAt"],
        session=session_payload["session"],
    )


async def refreshSessionHandler(*, request: Request, response: Response, refreshToken: Optional[str]):
    token = _extract_refresh_token(request, refreshToken)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required.")
    try:
        payload = await rotateSession(
            refreshToken=token,
            userAgent=request.headers.get("user-agent"),
            ipAddress=request.client.host if request.client else None,
        )
    except SessionError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    _set_refresh_cookie(response, payload["refreshToken"], payload["refreshTokenExpiresAt"])
    return {
        **_build_auth_response(
            user=payload["user"],
            access_token=payload["accessToken"],
            access_expires=payload["accessTokenExpiresAt"],
            session=payload["session"],
        ),
        "message": "Session refreshed.",
    }


async def logout(*, request: Request, response: Response):
    _clear_refresh_cookie(response)
    auth_state = getattr(request.state, "auth", None)
    if auth_state and auth_state.get("sessionId"):
        await revokeSession(auth_state["sessionId"])
    else:
        token = _extract_refresh_token(request)
        if token:
            await revokeByRefreshToken(token)

    return {"success": True, "message": "Logged out successfully."}


async def logoutAll(*, request: Request, response: Response):
    _clear_refresh_cookie(response)
    user = getattr(request.state, "user", None)
    if user:
        await revokeAllUserSessions(user.id)
    return {"success": True, "message": "All sessions revoked successfully."}


async def requestPasswordReset(*, email: str, response: Response, background: BackgroundTasks):
    user = await User.find_one(User.email == email.lower())
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This email is not registered with us. Please sign up first.")
    if not user.emailVerified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is not verified yet. Please verify your account before resetting the password.",
        )

    payload = await assignOtp(user, "passwordReset")
    await user.save()
    background.add_task(
        sendPasswordResetEmail,
        to=user.email,
        otp=payload["otp"],
        expiresMinutes=OTP_EXPIRY_MINUTES,
    )

    return {"success": True, "message": "If an account exists, a password reset code has been sent."}


async def resetPassword(*, email: str, otp: str, newPassword: str, request: Request, response: Response):
    user = await User.find_one(User.email == email.lower())
    if not user:
        return {"success": True, "message": "If an account exists, the password has been reset."}

    try:
        await verifyOtp(user, "passwordReset", otp)
    except OtpServiceError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    await revokeAllUserSessions(user.id)
    user.passwordHash = password_context.hash(newPassword)
    await user.save()

    session_payload = await createSession(
        user=user,
        userAgent=request.headers.get("user-agent"),
        ipAddress=request.client.host if request.client else None,
        metadata={"source": "passwordReset"},
    )
    _set_refresh_cookie(response, session_payload["refreshToken"], session_payload["refreshTokenExpiresAt"])

    return {
        **_build_auth_response(
            user=user,
            access_token=session_payload["accessToken"],
            access_expires=session_payload["accessTokenExpiresAt"],
            session=session_payload["session"],
        ),
        "message": "Password updated successfully. You're now signed in with your new password.",
    }


async def currentUser(*, request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return {"success": True, "data": {"user": _serialize_user(user)}}


async def listAddresses(*, request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return {"success": True, "data": {"addresses": _serialize_user(user)["addresses"]}}


async def addAddress(*, request: Request, payload: dict):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    if len(user.addresses) >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum of 5 addresses allowed.")

    normalized = payload.copy()
    normalized["contactName"] = (payload.get("contactName") or user.fullName or "").strip()
    normalized["phone"] = (payload.get("phone") or user.phone or "").strip()
    normalized["country"] = (payload.get("country") or "IN").strip()
    if len(normalized["country"]) <= 3:
        normalized["country"] = normalized["country"].upper()
    if not normalized["contactName"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Contact name is required.")
    if not normalized["phone"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Phone is required.")

    address = Address(**normalized)
    user.addresses.append(address)
    await user.save()
    return {"success": True, "data": {"addresses": _serialize_user(user)["addresses"]}}


async def updateAddress(*, request: Request, address_id: str, payload: dict):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    address = _find_address(user, address_id)
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    updates = payload.copy()
    if "contactName" in updates:
        updates["contactName"] = (updates.get("contactName") or address.contactName or user.fullName or "").strip()
    if "phone" in updates:
        updates["phone"] = (updates.get("phone") or address.phone or user.phone or "").strip()
    if "country" in updates:
        updates["country"] = (updates.get("country") or address.country or "IN").strip()
        if len(updates["country"]) <= 3:
          updates["country"] = updates["country"].upper()

    for key, value in updates.items():
        setattr(address, key, value)

    if not getattr(address, "contactName", None):
        setattr(address, "contactName", user.fullName or "")
    if not getattr(address, "phone", None):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Phone is required.")
    await user.save()
    return {"success": True, "data": {"addresses": _serialize_user(user)["addresses"]}}


async def deleteAddress(*, request: Request, address_id: str):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    before = len(user.addresses)
    user.addresses = [addr for addr in user.addresses if getattr(addr, "id", None) != address_id]
    if len(user.addresses) == before:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")
    await user.save()
    return {"success": True, "data": {"addresses": _serialize_user(user)["addresses"]}}
