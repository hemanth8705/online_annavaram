from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from beanie.odm.fields import PydanticObjectId

from ..models import Session, User

ACCESS_EXPIRY = os.getenv("JWT_ACCESS_EXPIRY", "15m")
REFRESH_EXPIRY = os.getenv("JWT_REFRESH_EXPIRY", "7d")


class SessionError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _get_secret(name: str) -> str:
    secret = os.getenv(name)
    if not secret:
        raise SessionError(f"{name} is not configured", status=500)
    return secret


def _parse_duration(value: str, fallback: timedelta) -> timedelta:
    value = str(value).strip().lower()
    if value.endswith("ms"):
        return timedelta(milliseconds=int(value[:-2]))
    if value.endswith("s"):
        return timedelta(seconds=int(value[:-1]))
    if value.endswith("m"):
        return timedelta(minutes=int(value[:-1]))
    if value.endswith("h"):
        return timedelta(hours=int(value[:-1]))
    if value.endswith("d"):
        return timedelta(days=int(value[:-1]))
    if value.isdigit():
        return timedelta(seconds=int(value))
    return fallback


ACCESS_EXPIRY_DELTA = _parse_duration(ACCESS_EXPIRY, timedelta(minutes=15))
REFRESH_EXPIRY_DELTA = _parse_duration(REFRESH_EXPIRY, timedelta(days=7))


def _hash_token(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _generate_refresh_token() -> str:
    secret = _get_secret("JWT_REFRESH_SECRET")
    random_part = secrets.token_hex(64)
    signature = hmac.new(secret.encode("utf-8"), random_part.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{random_part}.{signature}"


def _extract_refresh_components(token: str) -> str:
    parts = token.split(".")
    if len(parts) != 2:
        raise SessionError("Invalid refresh token", status=401)
    random_part, signature = parts
    secret = _get_secret("JWT_REFRESH_SECRET")
    expected_signature = hmac.new(secret.encode("utf-8"), random_part.encode("utf-8"), hashlib.sha256).hexdigest()
    provided = bytes.fromhex(signature)
    expected = bytes.fromhex(expected_signature)
    if len(provided) != len(expected) or not hmac.compare_digest(provided, expected):
        raise SessionError("Invalid refresh token", status=401)
    return random_part


def _sign_access_token(user: User, session: Session) -> tuple[str, datetime]:
    secret = _get_secret("JWT_ACCESS_SECRET")
    now = datetime.now(tz=timezone.utc)
    expires_at = now + ACCESS_EXPIRY_DELTA
    payload = {
        "sub": str(user.id),
        "sid": str(session.id),
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, expires_at


def verifyAccessToken(token: str) -> dict:
    secret = _get_secret("JWT_ACCESS_SECRET")
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise SessionError("Invalid or expired access token", status=401) from exc


def _coerce_object_id(value: str | PydanticObjectId) -> PydanticObjectId:
    if isinstance(value, PydanticObjectId):
        return value
    try:
        return PydanticObjectId(value)
    except Exception as exc:
        raise SessionError("Session not found", status=401) from exc


def _normalize_datetime(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _coerce_object_id(value: str | PydanticObjectId) -> PydanticObjectId:
    if isinstance(value, PydanticObjectId):
        return value
    try:
        return PydanticObjectId(value)
    except Exception as exc:
        raise SessionError("Session not found", status=401) from exc


async def createSession(*, user: User, userAgent: Optional[str], ipAddress: Optional[str], metadata: Optional[dict] = None):
    refresh_token = _generate_refresh_token()
    random_part = _extract_refresh_components(refresh_token)
    refresh_hash = _hash_token(random_part)
    expires_at = datetime.now(tz=timezone.utc) + REFRESH_EXPIRY_DELTA

    session = Session(
        user=user.id,
        refreshTokenHash=refresh_hash,
        expiresAt=expires_at,
        userAgent=userAgent,
        ipAddress=ipAddress,
        metadata=metadata,
    )
    await session.insert()

    access_token, access_expires_at = _sign_access_token(user, session)
    return {
        "session": session,
        "refreshToken": refresh_token,
        "refreshTokenExpiresAt": expires_at,
        "accessToken": access_token,
        "accessTokenExpiresAt": access_expires_at,
    }


async def validateSession(session_id: str | PydanticObjectId, user_id: str | PydanticObjectId) -> Session:
    session_object_id = _coerce_object_id(session_id)
    user_object_id = _coerce_object_id(user_id)
    session = await Session.find_one(Session.id == session_object_id, Session.user == user_object_id)
    if not session:
        raise SessionError("Session not found", status=401)
    if session.revokedAt:
        raise SessionError("Session revoked", status=401)
    expires_at = _normalize_datetime(session.expiresAt)
    if expires_at and expires_at < datetime.now(tz=timezone.utc):
        raise SessionError("Session expired", status=401)
    return session


async def rotateSession(*, refreshToken: str, userAgent: Optional[str], ipAddress: Optional[str]):
    random_part = _extract_refresh_components(refreshToken)
    refresh_hash = _hash_token(random_part)

    session = await Session.find_one(Session.refreshTokenHash == refresh_hash)
    if not session:
        raise SessionError("Invalid refresh token", status=401)
    if session.revokedAt:
        raise SessionError("Session revoked", status=401)
    now = datetime.now(tz=timezone.utc)
    expires_at = _normalize_datetime(session.expiresAt)
    if expires_at and expires_at < now:
        raise SessionError("Session expired", status=401)

    user = await User.get(session.user)
    if not user or not user.isActive:
        raise SessionError("User account unavailable", status=401)

    next_refresh = _generate_refresh_token()
    next_random = _extract_refresh_components(next_refresh)
    session.refreshTokenHash = _hash_token(next_random)
    session.expiresAt = now + REFRESH_EXPIRY_DELTA
    session.userAgent = userAgent
    session.ipAddress = ipAddress
    session.revokedAt = None
    await session.save()

    access_token, access_expires_at = _sign_access_token(user, session)
    return {
        "session": session,
        "user": user,
        "refreshToken": next_refresh,
        "refreshTokenExpiresAt": session.expiresAt,
        "accessToken": access_token,
        "accessTokenExpiresAt": access_expires_at,
    }


async def revokeSession(session_id: str | PydanticObjectId) -> None:
    session_object_id = _coerce_object_id(session_id)
    await Session.find(Session.id == session_object_id).update({"$set": {"revokedAt": datetime.now(tz=timezone.utc)}})


async def revokeByRefreshToken(refreshToken: str) -> None:
    try:
        random_part = _extract_refresh_components(refreshToken)
    except SessionError:
        return
    refresh_hash = _hash_token(random_part)
    await Session.find(Session.refreshTokenHash == refresh_hash).update({"$set": {"revokedAt": datetime.now(tz=timezone.utc)}})


async def revokeAllUserSessions(user_id: str | PydanticObjectId) -> None:
    user_object_id = _coerce_object_id(user_id)
    await Session.find(Session.user == user_object_id, Session.revokedAt == None).update(  # type: ignore[comparison-overlap]
        {"$set": {"revokedAt": datetime.now(tz=timezone.utc)}}
    )
