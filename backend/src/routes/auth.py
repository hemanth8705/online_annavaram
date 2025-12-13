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
    refreshToken: Optional[str] = Field(default=None)


class AddressPayload(BaseModel):
    label: Optional[str] = None
    contactName: Optional[str] = Field(default=None, min_length=1)
    phone: Optional[str] = Field(default=None, min_length=5)
    line1: str = Field(..., min_length=1)
    line2: Optional[str] = None
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    postalCode: str = Field(..., min_length=3)
    country: str = Field(default="IN", min_length=2, max_length=64)


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
async def refresh(request: Request, response: Response, payload: Optional[RefreshPayload] = None):
    refresh_token = payload.refreshToken if payload else None
    return await authController.refreshSessionHandler(
        request=request,
        response=response,
        refreshToken=refresh_token,
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


@router.get("/addresses")
async def list_addresses(request: Request, user: User = Depends(authenticate)):
    return await authController.listAddresses(request=request)


@router.post("/addresses")
async def add_address(payload: AddressPayload, request: Request, user: User = Depends(authenticate)):
    return await authController.addAddress(request=request, payload=payload.model_dump())


@router.put("/addresses/{addressId}")
async def update_address(addressId: str, payload: AddressPayload, request: Request, user: User = Depends(authenticate)):
    return await authController.updateAddress(request=request, address_id=addressId, payload=payload.model_dump())


@router.delete("/addresses/{addressId}")
async def delete_address(addressId: str, request: Request, user: User = Depends(authenticate)):
    return await authController.deleteAddress(request=request, address_id=addressId)


class GoogleAuthPayload(BaseModel):
    idToken: str = Field(..., min_length=1, description="Google ID token from frontend")


@router.post("/google")
async def google_auth(payload: GoogleAuthPayload, request: Request, response: Response):
    """
    Authenticate with Google ID token.
    Verifies the token server-side and creates/logs in the user.
    """
    return await authController.googleAuth(
        idToken=payload.idToken,
        request=request,
        response=response,
    )
