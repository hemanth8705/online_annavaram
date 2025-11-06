from __future__ import annotations

import logging
import os
from email.message import EmailMessage
from typing import Optional

import aiosmtplib

logger = logging.getLogger(__name__)


class MailerError(Exception):
    def __init__(self, message: str, status: int = 500):
        super().__init__(message)
        self.status = status


def _smtp_config():
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    if not host or not port:
        raise MailerError("SMTP configuration is incomplete. Please set SMTP_HOST and SMTP_PORT.")
    secure = str(os.getenv("SMTP_SECURE", "false")).lower() == "true"
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM") or username
    if not sender:
        raise MailerError("SMTP_FROM or SMTP_USER must be configured")
    return {
        "host": host,
        "port": int(port),
        "secure": secure,
        "username": username,
        "password": password,
        "sender": sender,
    }


async def sendMail(*, to: str, subject: str, text: Optional[str] = None, html: Optional[str] = None):
    config = _smtp_config()
    message = EmailMessage()
    message["From"] = config["sender"]
    message["To"] = to
    message["Subject"] = subject
    if text:
        message.set_content(text)
    if html:
        message.add_alternative(html, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=config["host"],
        port=config["port"],
        username=config["username"],
        password=config["password"],
        start_tls=not config["secure"],
        use_tls=config["secure"],
    )
    logger.info("[Mailer] message sent", extra={"to": to, "subject": subject})


async def sendOtpEmail(*, to: str, otp: str, expiresMinutes: int = 10):
    subject = "Your Online Annavaram verification code"
    text = (
        f"Use the following verification code to complete your signup: {otp}. "
        f"It expires in {expiresMinutes} minutes."
    )
    html = f"""
    <p>Namaste!</p>
    <p>Your verification code is <strong style="font-size:18px;">{otp}</strong>.</p>
    <p>The code will expire in {expiresMinutes} minutes.</p>
    <p>If you didn't request this code, please ignore this email.</p>
    <p>&mdash; Online Annavaram</p>
    """
    await sendMail(to=to, subject=subject, text=text, html=html)


async def sendPasswordResetEmail(*, to: str, otp: str, expiresMinutes: int = 10):
    subject = "Reset your Online Annavaram password"
    text = (
        f"Use this code to reset your password: {otp}. "
        f"It expires in {expiresMinutes} minutes."
    )
    html = f"""
    <p>Namaste!</p>
    <p>Your password reset code is <strong style="font-size:18px;">{otp}</strong>.</p>
    <p>The code will expire in {expiresMinutes} minutes.</p>
    <p>If you didn't request a reset, you can safely ignore this message.</p>
    <p>&mdash; Online Annavaram</p>
    """
    await sendMail(to=to, subject=subject, text=text, html=html)

