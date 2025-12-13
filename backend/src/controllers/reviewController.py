from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from beanie.operators import In
from beanie.odm.fields import PydanticObjectId

from ..models import Order, OrderItem, Product, Review, User


def _invalid_object_id(object_id: str) -> bool:
    try:
        PydanticObjectId(object_id)
        return False
    except Exception:
        return True


async def _check_verified_purchase(user_id: PydanticObjectId, product_id: PydanticObjectId) -> bool:
    """Check if user has purchased this product"""
    orders = await Order.find(
        Order.user == user_id,
        In(Order.status, ["paid", "shipped", "delivered"]),
    ).to_list()
    
    for order in orders:
        order_items = await OrderItem.find(OrderItem.order == order.id, OrderItem.product == product_id).to_list()
        if order_items:
            return True
    return False


async def listReviews(*, productId: str, page: int = 1, limit: int = 10):
    """Get all reviews for a product"""
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    
    product = await Product.get(productId)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    skip = (page - 1) * limit
    reviews = await Review.find(
        Review.product == product.id,
        Review.isApproved == True
    ).sort(-Review.createdAt).skip(skip).limit(limit).to_list()
    
    total = await Review.find(Review.product == product.id, Review.isApproved == True).count()
    
    # Fetch user details for each review
    review_list = []
    for review in reviews:
        user = await User.get(review.user)
        review_list.append({
            "id": str(review.id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "isVerifiedPurchase": review.isVerifiedPurchase,
            "helpfulCount": review.helpfulCount,
            "createdAt": review.createdAt.isoformat() if review.createdAt else None,
            "user": {
                "id": str(user.id),
                "fullName": user.fullName if user else "Anonymous",
            } if user else None,
        })
    
    # Calculate average rating
    all_reviews = await Review.find(Review.product == product.id, Review.isApproved == True).to_list()
    avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews) if all_reviews else 0
    
    return {
        "success": True,
        "data": {
            "reviews": review_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
            "stats": {
                "averageRating": round(avg_rating, 2),
                "totalReviews": total,
            },
        },
    }


async def createReview(*, user: User, productId: str, rating: int, title: Optional[str], comment: Optional[str]):
    """Create a new review"""
    if _invalid_object_id(productId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")
    
    product = await Product.get(productId)
    if not product or not product.isActive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")
    
    # Check if user already reviewed this product
    existing = await Review.find_one(Review.user == user.id, Review.product == product.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this product")
    
    # Check if verified purchase
    is_verified = await _check_verified_purchase(user.id, product.id)
    
    review = Review(
        user=user.id,
        product=product.id,
        rating=rating,
        title=title,
        comment=comment,
        isVerifiedPurchase=is_verified,
        isApproved=True,  # Auto-approve, can add moderation later
    )
    await review.insert()
    
    return {
        "success": True,
        "message": "Review submitted successfully",
        "data": {
            "id": str(review.id),
            "rating": review.rating,
            "isVerifiedPurchase": review.isVerifiedPurchase,
        },
    }


async def updateReview(*, user: User, reviewId: str, rating: Optional[int], title: Optional[str], comment: Optional[str]):
    """Update an existing review"""
    if _invalid_object_id(reviewId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid review ID")
    
    review = await Review.get(reviewId)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    
    if review.user != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own reviews")
    
    if rating is not None:
        review.rating = rating
    if title is not None:
        review.title = title
    if comment is not None:
        review.comment = comment
    
    await review.save()
    
    return {
        "success": True,
        "message": "Review updated successfully",
        "data": {
            "id": str(review.id),
            "rating": review.rating,
        },
    }


async def deleteReview(*, user: User, reviewId: str):
    """Delete a review"""
    if _invalid_object_id(reviewId):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid review ID")
    
    review = await Review.get(reviewId)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    
    if review.user != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own reviews")
    
    await review.delete()
    
    return {
        "success": True,
        "message": "Review deleted successfully",
    }


async def getUserReviews(*, user: User):
    """Get all reviews by a user"""
    reviews = await Review.find(Review.user == user.id).sort(-Review.createdAt).to_list()
    
    review_list = []
    for review in reviews:
        product = await Product.get(review.product)
        review_list.append({
            "id": str(review.id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "isVerifiedPurchase": review.isVerifiedPurchase,
            "helpfulCount": review.helpfulCount,
            "createdAt": review.createdAt.isoformat() if review.createdAt else None,
            "product": {
                "id": str(product.id),
                "name": product.name,
                "slug": product.slug,
                "images": product.images,
            } if product else None,
        })
    
    return {
        "success": True,
        "data": {
            "reviews": review_list,
            "count": len(review_list),
        },
    }
