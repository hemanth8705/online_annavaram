from __future__ import annotations

from beanie.odm.fields import PydanticObjectId

from .base import TimeStampedDocument


class Wishlist(TimeStampedDocument):
    user: PydanticObjectId
    product: PydanticObjectId

    class Settings:
        name = "wishlists"
        use_revision = False
        indexes = [
            [("user", 1), ("product", 1)],  # Compound index to ensure uniqueness per user-product
        ]
