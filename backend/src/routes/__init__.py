from .admin import router as admin_router
from .auth import router as auth_router
from .cart import router as cart_router
from .orders import router as orders_router
from .payments import router as payments_router
from .products import router as products_router
from .testRoute import router as test_router
from .wishlist import router as wishlist_router
from .reviews import router as reviews_router

__all__ = [
    "admin_router",
    "auth_router",
    "cart_router",
    "orders_router",
    "payments_router",
    "products_router",
    "test_router",
    "wishlist_router",
    "reviews_router",
]
