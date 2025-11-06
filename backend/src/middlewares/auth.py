from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from ..models import User
from ..services.sessionService import (
    SessionError,
    validateSession,
    verifyAccessToken,
)


async def authenticate(request: Request):
    authorization = request.headers.get("Authorization", "")
    token = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        payload = verifyAccessToken(token)
        session = await validateSession(payload["sid"], payload["sub"])
        user = await User.get(payload["sub"])
    except SessionError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.isActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")

    request.state.auth = {
        "userId": str(user.id),
        "sessionId": str(session.id),
        "role": user.role,
    }
    request.state.user = user
    request.state.session = session
    return user


async def requireAdmin(user: User = Depends(authenticate)):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user

