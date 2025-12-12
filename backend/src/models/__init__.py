from .User import User
from .Product import Product
from .Cart import Cart
from .CartItem import CartItem
from .Order import Order
from .OrderItem import OrderItem
from .Payment import Payment
from .Session import Session
from .Wishlist import Wishlist
from .Review import Review

DOCUMENT_MODELS = [
    User,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Payment,
    Session,
    Wishlist,
    Review,
]

__all__ = [
    "User",
    "Product",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "Payment",
    "Session",
    "DOCUMENT_MODELS",
]
