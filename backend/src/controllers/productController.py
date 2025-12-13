from __future__ import annotations

from math import ceil
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel

from ..models import Product, Review


async def _serialize_product(product: Product) -> dict:
    payload = product.model_dump()
    payload["id"] = str(product.id)
    
    # Get review statistics
    reviews = await Review.find(Review.product == product.id, Review.isApproved == True).to_list()
    if reviews:
        total_rating = sum(review.rating for review in reviews)
        payload["averageRating"] = round(total_rating / len(reviews), 1)
        payload["reviewCount"] = len(reviews)
    else:
        payload["averageRating"] = 0
        payload["reviewCount"] = 0
    
    return payload


def _parse_pagination(page: Optional[int], limit: Optional[int]):
    page = max(page or 1, 1)
    limit = min(max(limit or 12, 1), 100)
    skip = (page - 1) * limit
    return page, limit, skip


async def listProducts(
    *, 
    search: Optional[str], 
    category: Optional[str], 
    isActive: Optional[bool], 
    page: Optional[int], 
    limit: Optional[int],
    sortBy: Optional[str] = None,
    sortOrder: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
):
    page, limit, skip = _parse_pagination(page, limit)
    query: dict = {}
    
    # For user-facing queries, only show active and non-deleted products
    if isActive is None:
        query["isActive"] = True
    elif isActive is not None:
        query["isActive"] = isActive
    
    # Exclude deleted products from user view
    query["isDeleted"] = False
    
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"description": regex},
            {"category": regex},
        ]
    if category:
        query["category"] = category
    
    # Price range filtering
    if minPrice is not None or maxPrice is not None:
        query["price"] = {}
        if minPrice is not None:
            query["price"]["$gte"] = minPrice
        if maxPrice is not None:
            query["price"]["$lte"] = maxPrice
    
    # Sorting
    sort_field = "-createdAt"  # default: newest first
    if sortBy:
        sort_order_prefix = "-" if sortOrder == "desc" else "+"
        if sortBy == "price":
            sort_field = f"{sort_order_prefix}price"
        elif sortBy == "name":
            sort_field = f"{sort_order_prefix}name"
        elif sortBy == "newest":
            sort_field = "-createdAt"
        elif sortBy == "oldest":
            sort_field = "+createdAt"

    items = await Product.find(query).sort(sort_field).skip(skip).limit(limit).to_list()
    total = await Product.find(query).count()
    
    # Serialize products with review stats
    serialized_items = []
    for item in items:
        serialized_items.append(await _serialize_product(item))

    return {
        "success": True,
        "data": serialized_items,
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
    return {"success": True, "data": await _serialize_product(product)}


async def createProduct(*, payload: dict):
    product = Product(**payload)
    await product.insert()
    return {"success": True, "data": await _serialize_product(product)}


async def updateProduct(*, product_id: str, payload: dict):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for key, value in payload.items():
        setattr(product, key, value)
    await product.save()
    return {"success": True, "data": await _serialize_product(product)}


async def deleteProduct(*, product_id: str):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await product.delete()
    return {"success": True, "message": "Product deleted"}
