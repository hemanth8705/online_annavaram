from __future__ import annotations

import asyncio
from pathlib import Path

import httpx
from dotenv import load_dotenv

from ..db import connect_to_database, disconnect_from_database
from ..models import Cart, CartItem, Product, User
from ..server import app

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


async def fetch_json(client: httpx.AsyncClient, method: str, url: str, **kwargs):
    response = await client.request(method, url, **kwargs)
    try:
        payload = response.json()
    except ValueError:
        payload = response.text
    return {"status": response.status_code, "payload": payload}


async def login(client: httpx.AsyncClient, email: str, password: str):
    response = await fetch_json(
        client,
        "POST",
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    if response["status"] != 200:
        raise RuntimeError(f"Failed to login {email}: {response['payload']}")
    return response["payload"]["data"]["accessToken"]


async def run():
    await connect_to_database()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        customer = await User.find_one(User.email == "sita@example.com")
        admin = await User.find_one(User.email == "admin@onlineannavaram.test")
        if not customer or not admin:
            raise RuntimeError("Seed users not found. Run the seed script first.")

        customer_token = await login(client, customer.email, "demo-password")
        admin_token = await login(client, admin.email, "demo-password")

        auth_headers = {
            "customer": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {customer_token}",
            },
            "admin": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {admin_token}",
            },
        }

        active_cart = await Cart.find_one(Cart.user == customer.id, Cart.status == "active")
        if not active_cart:
            active_cart = Cart(user=customer.id, status="active")
            await active_cart.insert()
        await CartItem.find(CartItem.cart == active_cart.id).delete()

        products = await Product.find_all().to_list()
        product_for_cart = products[0]

        print("1) GET /api/products")
        print(
            await fetch_json(
                client,
                "GET",
                "/api/products",
                headers={"Authorization": auth_headers["customer"]["Authorization"]},
            )
        )

        print("2) POST /api/cart/items")
        print(
            await fetch_json(
                client,
                "POST",
                "/api/cart/items",
                headers=auth_headers["customer"],
                json={"productId": str(product_for_cart.id), "quantity": 2},
            )
        )

        cart_items = await CartItem.find(CartItem.cart == active_cart.id).to_list()
        first_item = cart_items[0]

        print("3) PATCH /api/cart/items/:itemId")
        print(
            await fetch_json(
                client,
                "PATCH",
                f"/api/cart/items/{first_item.id}",
                headers=auth_headers["customer"],
                json={"quantity": 3},
            )
        )

        primary_address = customer.addresses[0] if customer.addresses else None
        shipping_address = {
            "name": customer.fullName,
            "phone": customer.phone,
            "line1": "Fallback Address",
            "city": "Annavaram",
            "state": "Andhra Pradesh",
            "postalCode": "533406",
            "country": "IN",
        }
        if primary_address:
            shipping_address.update(
                {
                    key: primary_address.get(key)
                    for key in ["line1", "line2", "city", "state", "postalCode", "country"]
                    if primary_address.get(key)
                }
            )

        print("4) POST /api/orders")
        print(
            await fetch_json(
                client,
                "POST",
                "/api/orders",
                headers=auth_headers["customer"],
                json={
                    "shippingAddress": shipping_address,
                    "notes": "Automated order from test script",
                },
            )
        )

        print("5) GET /api/orders")
        print(
            await fetch_json(
                client,
                "GET",
                "/api/orders",
                headers=auth_headers["customer"],
            )
        )

        print("6) GET /api/admin/orders")
        print(
            await fetch_json(
                client,
                "GET",
                "/api/admin/orders",
                headers=auth_headers["admin"],
            )
        )

    await disconnect_from_database()


if __name__ == "__main__":
    asyncio.run(run())
