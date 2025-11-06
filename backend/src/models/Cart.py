from __future__ import annotations

from typing import Literal

from beanie import Indexed
from beanie.odm.fields import PydanticObjectId

from .base import TimeStampedDocument


class Cart(TimeStampedDocument):
    user: Indexed(PydanticObjectId)  # type: ignore[assignment]
    status: Literal["active", "converted", "abandoned"] = "active"

    class Settings:
        name = "carts"
        use_revision = False
