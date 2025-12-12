from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..controllers import reviewController
from ..middlewares.auth import authenticate
from ..models import User

router = APIRouter()


class ReviewPayload(BaseModel):
    productId: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=100)
    comment: Optional[str] = Field(default=None, max_length=1000)


class ReviewUpdatePayload(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=100)
    comment: Optional[str] = Field(default=None, max_length=1000)


@router.get("/products/{product_id}")
async def get_product_reviews(product_id: str, page: int = 1, limit: int = 10):
    """Get all reviews for a product"""
    return await reviewController.listReviews(productId=product_id, page=page, limit=limit)


@router.post("/")
async def create_review(payload: ReviewPayload, user: User = Depends(authenticate)):
    """Create a new review"""
    return await reviewController.createReview(
        user=user,
        productId=payload.productId,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
    )


@router.put("/{review_id}")
async def update_review(review_id: str, payload: ReviewUpdatePayload, user: User = Depends(authenticate)):
    """Update an existing review"""
    return await reviewController.updateReview(
        user=user,
        reviewId=review_id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
    )


@router.delete("/{review_id}")
async def delete_review(review_id: str, user: User = Depends(authenticate)):
    """Delete a review"""
    return await reviewController.deleteReview(user=user, reviewId=review_id)


@router.get("/my-reviews", include_in_schema=True)
@router.get("/my-reviews/", include_in_schema=False)
async def get_my_reviews(user: User = Depends(authenticate)):
    """Get all reviews by the current user"""
    return await reviewController.getUserReviews(user=user)
