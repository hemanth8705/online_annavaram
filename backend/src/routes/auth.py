from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field

from ..controllers import authController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class SignupPayload(BaseModel):
    fullName: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class OtpPayload(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=8)


class ResendPayload(BaseModel):
    email: EmailStr


class ResetPayload(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=8)
    newPassword: str = Field(..., min_length=8)


class RefreshPayload(BaseModel):
    refreshToken: Optional[str] = None


@router.post("/signup")
async def signup(payload: SignupPayload, response: Response, background: BackgroundTasks):
    return await authController.signup(
        fullName=payload.fullName,
        email=payload.email,
        password=payload.password,
        phone=payload.phone,
        response=response,
        background=background,
    )


@router.post("/login")
async def login(payload: LoginPayload, request: Request, response: Response):
    return await authController.login(
        email=payload.email,
        password=payload.password,
        request=request,
        response=response,
    )


@router.post("/refresh")
async def refresh(payload: RefreshPayload, request: Request, response: Response):
    return await authController.refreshSessionHandler(
        request=request,
        response=response,
        refreshToken=payload.refreshToken,
    )


@router.post("/verify-email")
async def verify_email(payload: OtpPayload, request: Request, response: Response):
    return await authController.verifyEmail(
        email=payload.email,
        otp=payload.otp,
        request=request,
        response=response,
    )


@router.post("/resend-otp")
async def resend_otp(payload: ResendPayload, response: Response, background: BackgroundTasks):
    return await authController.resendOtp(
        email=payload.email,
        response=response,
        background=background,
    )


@router.post("/forgot-password")
async def request_password_reset(payload: ResendPayload, response: Response, background: BackgroundTasks):
    return await authController.requestPasswordReset(
        email=payload.email,
        response=response,
        background=background,
    )


@router.post("/reset-password")
async def reset_password(payload: ResetPayload, request: Request, response: Response):
    return await authController.resetPassword(
        email=payload.email,
        otp=payload.otp,
        newPassword=payload.newPassword,
        request=request,
        response=response,
    )


@router.post("/logout")
async def logout(request: Request, response: Response, user: User = Depends(authenticate)):
    return await authController.logout(request=request, response=response)


@router.post("/logout-all")
async def logout_all(request: Request, response: Response, user: User = Depends(authenticate)):
    return await authController.logoutAll(request=request, response=response)


@router.get("/me")
async def current_user(request: Request, user: User = Depends(authenticate)):
    return await authController.currentUser(request=request)
