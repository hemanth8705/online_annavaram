from __future__ import annotations

from math import ceil
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel

from ..models import Product


def _serialize_product(product: Product) -> dict:
    payload = product.model_dump()
    payload["id"] = str(product.id)
    return payload


def _parse_pagination(page: Optional[int], limit: Optional[int]):
    page = max(page or 1, 1)
    limit = min(max(limit or 12, 1), 100)
    skip = (page - 1) * limit
    return page, limit, skip


async def listProducts(*, search: Optional[str], category: Optional[str], isActive: Optional[bool], page: Optional[int], limit: Optional[int]):
    page, limit, skip = _parse_pagination(page, limit)
    query: dict = {}
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"description": regex},
            {"category": regex},
        ]
    if category:
        query["category"] = category
    if isActive is not None:
        query["isActive"] = isActive

    items = await Product.find(query).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await Product.find(query).count()

    return {
        "success": True,
        "data": [_serialize_product(item) for item in items],
        "meta": {
            "page": page,
            "limit": limit,
            "totalPages": ceil(total / limit) if total else 1,
            "totalItems": total,
        },
    }


async def getProduct(*, product_id: str):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return {"success": True, "data": _serialize_product(product)}


async def createProduct(*, payload: dict):
    product = Product(**payload)
    await product.insert()
    return {"success": True, "data": _serialize_product(product)}


async def updateProduct(*, product_id: str, payload: dict):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for key, value in payload.items():
        setattr(product, key, value)
    await product.save()
    return {"success": True, "data": _serialize_product(product)}


async def deleteProduct(*, product_id: str):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await product.delete()
    return {"success": True, "message": "Product deleted"}
