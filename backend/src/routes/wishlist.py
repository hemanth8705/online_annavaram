from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..controllers import wishlistController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class WishlistItemPayload(BaseModel):
    productId: str


@router.get("/")
async def get_wishlist(user: User = Depends(authenticate)):
    """Get all items in user's wishlist"""
    return await wishlistController.getWishlist(user=user)


@router.post("/")
async def add_to_wishlist(payload: WishlistItemPayload, user: User = Depends(authenticate)):
    """Add a product to wishlist"""
    return await wishlistController.addToWishlist(user=user, productId=payload.productId)


@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user: User = Depends(authenticate)):
    """Remove a product from wishlist"""
    return await wishlistController.removeFromWishlist(user=user, productId=product_id)


@router.post("/toggle")
async def toggle_wishlist(payload: WishlistItemPayload, user: User = Depends(authenticate)):
    """Toggle product in wishlist (add if not present, remove if present)"""
    return await wishlistController.toggleWishlist(user=user, productId=payload.productId)


@router.delete("/")
async def clear_wishlist(user: User = Depends(authenticate)):
    """Clear all items from wishlist"""
    return await wishlistController.clearWishlist(user=user)
