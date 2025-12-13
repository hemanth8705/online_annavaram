"""
Role-Based Access Control Utilities
Ensures proper data access based on user roles
"""

from typing import Optional
from fastapi import HTTPException, status
from ..models.User import User


def check_admin_role(user: Optional[User]) -> None:
    """
    Verify that the user has admin role
    Raises HTTPException if user is not an admin
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


def check_customer_or_admin(user: Optional[User]) -> None:
    """
    Verify that the user is authenticated
    Allows both customers and admins
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )


def check_resource_owner_or_admin(user: Optional[User], resource_user_id: str) -> None:
    """
    Verify that the user owns the resource or is an admin
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if user.role != "admin" and str(user.id) != str(resource_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )


def filter_active_products(query: dict) -> dict:
    """
    Add filters to only show active products to non-admin users
    """
    return {
        **query,
        "isActive": True,
        "isDeleted": False
    }


def filter_approved_reviews(query: dict) -> dict:
    """
    Add filters to only show approved reviews to non-admin users
    """
    return {
        **query,
        "isApproved": True,
        "isDeleted": False
    }


def can_modify_product(user: Optional[User]) -> bool:
    """
    Check if user can create/update/delete products
    Only admins can modify products
    """
    return user is not None and user.role == "admin"


def can_modify_category(user: Optional[User]) -> bool:
    """
    Check if user can create/update/delete categories
    Only admins can modify categories
    """
    return user is not None and user.role == "admin"


def can_update_order_status(user: Optional[User]) -> bool:
    """
    Check if user can update order status
    Only admins can update order status
    """
    return user is not None and user.role == "admin"


def can_moderate_review(user: Optional[User]) -> bool:
    """
    Check if user can moderate reviews (approve/delete)
    Only admins can moderate reviews
    """
    return user is not None and user.role == "admin"


def can_view_all_orders(user: Optional[User]) -> bool:
    """
    Check if user can view all orders
    Only admins can view all orders
    """
    return user is not None and user.role == "admin"


def can_view_order(user: Optional[User], order_user_id: str) -> bool:
    """
    Check if user can view a specific order
    Users can view their own orders, admins can view all
    """
    if not user:
        return False
    
    if user.role == "admin":
        return True
    
    return str(user.id) == str(order_user_id)


def can_create_review(user: Optional[User]) -> bool:
    """
    Check if user can create reviews
    Only customers can create reviews
    """
    return user is not None and user.role == "customer"


def can_edit_review(user: Optional[User], review_user_id: str) -> bool:
    """
    Check if user can edit/delete a review
    Admins can edit any review, users cannot edit their own after creation
    """
    if not user:
        return False
    
    # Only admins can edit reviews
    return user.role == "admin"
