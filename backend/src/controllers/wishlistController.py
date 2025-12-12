from __future__ import annotations

from fastapi import HTTPException, status
from beanie.odm.fields import PydanticObjectId

from ..models import Product, User, Wishlist


def _invalid_object_id(object_id: str) -> bool:
    try:
        PydanticObjectId(object_id)
        return False
    except Exception:
        return True


async def getWishlist(*, user: User):
    """Get all wishlist items for a user"""
    wishlist_items = await Wishlist.find(Wishlist.user == user.id).to_list()
    
    # Fetch product details for each wishlist item
    items = []
    for item in wishlist_items:
        product = await Product.get(item.product)
        if product and product.isActive:
            items.append({
                "id": str(item.id),
                "productId": str(product.id),
                "name": product.name,
                "price": product.price,
                "category": product.category,
                "slug": product.slug,
                "images": product.images,
                "image": product.images[0] if product.images else None,
                "stock": product.stock,
                "createdAt": item.createdAt.isoformat() if item.createdAt else None,
            })
    
    return {
        "success": True,
        "data": {
            "items": items,
            "count": len(items),
        },
    }


async def addToWishlist(*, user: User, productId: str):
    """Add a product to user's wishlist"""
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    
    product = await Product.get(productId)
    if not product or not product.isActive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    
    # Check if already in wishlist
    existing = await Wishlist.find_one(Wishlist.user == user.id, Wishlist.product == product.id)
    if existing:
        return {
            "success": True,
            "message": "Product already in wishlist",
            "data": {
                "id": str(existing.id),
                "productId": str(product.id),
            },
        }
    
    # Add to wishlist
    wishlist_item = Wishlist(
        user=user.id,
        product=product.id,
    )
    await wishlist_item.insert()
    
    return {
        "success": True,
        "message": "Added to wishlist",
        "data": {
            "id": str(wishlist_item.id),
            "productId": str(product.id),
        },
    }


async def removeFromWishlist(*, user: User, productId: str):
    """Remove a product from user's wishlist"""
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    
    wishlist_item = await Wishlist.find_one(Wishlist.user == user.id, Wishlist.product == PydanticObjectId(productId))
    if not wishlist_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not in wishlist")
    
    await wishlist_item.delete()
    
    return {
        "success": True,
        "message": "Removed from wishlist",
    }


async def toggleWishlist(*, user: User, productId: str):
    """Toggle product in wishlist - add if not present, remove if present"""
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    
    product = await Product.get(productId)
    if not product or not product.isActive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    
    # Check if already in wishlist
    existing = await Wishlist.find_one(Wishlist.user == user.id, Wishlist.product == product.id)
    
    if existing:
        # Remove from wishlist
        await existing.delete()
        return {
            "success": True,
            "message": "Removed from wishlist",
            "data": {
                "inWishlist": False,
                "productId": str(product.id),
            },
        }
    else:
        # Add to wishlist
        wishlist_item = Wishlist(
            user=user.id,
            product=product.id,
        )
        await wishlist_item.insert()
        return {
            "success": True,
            "message": "Added to wishlist",
            "data": {
                "inWishlist": True,
                "productId": str(product.id),
                "id": str(wishlist_item.id),
            },
        }


async def clearWishlist(*, user: User):
    """Clear all items from user's wishlist"""
    await Wishlist.find(Wishlist.user == user.id).delete()
    
    return {
        "success": True,
        "message": "Wishlist cleared",
    }
