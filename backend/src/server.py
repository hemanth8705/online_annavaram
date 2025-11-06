from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Iterable, List, Optional

from dotenv import load_dotenv, dotenv_values
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse

from .db import connect_to_database, disconnect_from_database
from .routes import (
    admin_router,
    auth_router,
    cart_router,
    orders_router,
    payments_router,
    products_router,
    test_router,
)

# Load environment variables from backend/.env (and project root if present)
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(BACKEND_DIR / ".env", override=True)

logger = logging.getLogger("uvicorn.error")


def _build_allowed_origins(port: int) -> List[str]:
    explicit_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    ]
    implicit_origins = [
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}",
        os.getenv("API_PUBLIC_ORIGIN"),
    ]
    return list({origin for origin in implicit_origins if origin} | set(explicit_origins))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_to_database()
    try:
        yield
    finally:
        await disconnect_from_database()


def create_app() -> FastAPI:
    port = int(os.getenv("PORT", "4000"))
    app = FastAPI(
        title="Online Annavaram API",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url="/api/docs.json",
        lifespan=lifespan,
    )

    allowed_origins = _build_allowed_origins(port)
    if allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/")
    async def healthcheck():
        return {"message": "Server running"}

    @app.get("/api/docs", include_in_schema=False)
    async def custom_swagger_ui():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title="Online Annavaram API Docs",
            oauth2_redirect_url=None,
        )

    register_routes(app)
    register_exception_handlers(app)

    return app


def register_routes(app: FastAPI) -> None:
    app.include_router(test_router, prefix="/api/test", tags=["system"])
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    app.include_router(products_router, prefix="/api/products", tags=["products"])
    app.include_router(cart_router, prefix="/api/cart", tags=["cart"])
    app.include_router(orders_router, prefix="/api/orders", tags=["orders"])
    app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
    app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": "Validation error",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(_request: Request, exc: Exception):
        status = getattr(exc, "status_code", getattr(exc, "status", 500))
        message = str(exc) or "Internal server error"
        logger.exception("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=status if isinstance(status, int) else 500,
            content={"success": False, "message": message},
        )


app = create_app()
