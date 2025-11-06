from __future__ import annotations

from fastapi import APIRouter, Depends

from ..controllers import orderController
from ..middlewares.auth import requireAdmin
from ..models import User

router = APIRouter()


@router.get("/orders")
async def list_all_orders(admin: User = Depends(requireAdmin)):
    return await orderController.listAllOrders()
