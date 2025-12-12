from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Literal
from uuid import uuid4

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field

from .base import TimeStampedDocument


class Address(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex)
    label: Optional[str] = None
    contactName: Optional[str] = None
    phone: Optional[str] = None
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postalCode: str
    country: str = Field(default="IN")


class OTPState(BaseModel):
    otpHash: Optional[str] = None
    otpExpiresAt: Optional[datetime] = None
    attempts: int = 0
    sentHistory: List[datetime] = Field(default_factory=list)


class User(TimeStampedDocument):
    fullName: str
    email: Indexed(EmailStr, unique=True)  # type: ignore[assignment]
    passwordHash: str
    phone: Optional[str] = None
    role: Literal["customer", "admin"] = "customer"
    addresses: List[Address] = Field(default_factory=list)
    isActive: bool = True
    emailVerified: bool = False
    emailVerifiedAt: Optional[datetime] = None
    emailVerification: OTPState = Field(default_factory=OTPState)
    passwordReset: OTPState = Field(default_factory=OTPState)

    class Settings:
        name = "users"
        use_revision = False
