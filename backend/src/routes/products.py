from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from ..controllers import productController
from ..middlewares.auth import requireAdmin
from ..models import User

router = APIRouter()


class ProductBase(BaseModel):
    name: Optional[str] = Field(default=None)
    slug: Optional[str] = Field(default=None)
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="INR")
    stock: Optional[int] = Field(default=0, ge=0)
    category: Optional[str] = None
    images: Optional[List[str]] = None
    isActive: Optional[bool] = True

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: Optional[str]) -> Optional[str]:
        return value.lower() if value else value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: Optional[str]) -> Optional[str]:
        return value.upper() if value else value

    @field_validator("images")
    @classmethod
    def ensure_images(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return value
        return [item.strip() for item in value if item]


class ProductCreate(ProductBase):
    name: str
    slug: str
    price: float
    stock: int


class ProductUpdate(ProductBase):
    pass


@router.get("/")
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    isActive: Optional[bool] = None,
    page: Optional[int] = None,
    limit: Optional[int] = None,
):
    return await productController.listProducts(
        search=search,
        category=category,
        isActive=isActive,
        page=page,
        limit=limit,
    )


@router.get("/{product_id}")
async def get_product(product_id: str):
    return await productController.getProduct(product_id=product_id)


@router.post("/")
async def create_product(payload: ProductCreate, admin: User = Depends(requireAdmin)):
    return await productController.createProduct(payload=payload.model_dump(exclude_none=True))


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    admin: User = Depends(requireAdmin),
):
    return await productController.updateProduct(
        product_id=product_id,
        payload={k: v for k, v in payload.model_dump(exclude_none=True).items()},
    )


@router.delete("/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(requireAdmin)):
    return await productController.deleteProduct(product_id=product_id)
