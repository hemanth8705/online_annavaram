from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from passlib.context import CryptContext

from ..db import connect_to_database, disconnect_from_database
from ..models import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    Payment,
    Product,
    User,
)

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

password_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")


async def clear_collections():
    await CartItem.find_all().delete()
    await OrderItem.find_all().delete()
    await Payment.find_all().delete()
    await Cart.find_all().delete()
    await Order.find_all().delete()
    await Product.find_all().delete()
    await User.find_all().delete()


async def seed_data():
    password_hash = password_context.hash("demo-password")

    admin_user = User(
        fullName="Kana Vindu Admin",
        email="admin@onlineannavaram.com",
        passwordHash=password_hash,
        role="admin",
        phone="9999999900",
        emailVerified=True,
        emailVerifiedAt=datetime.now(tz=timezone.utc),
    )
    customer_user = User(
        fullName="Sita Lakshmi",
        email="sita@example.com",
        passwordHash=password_hash,
        phone="9999999901",
        addresses=[
            {
                "label": "Home",
                "line1": "12-34 Main Road",
                "line2": "Near Temple Street",
                "city": "Annavaram",
                "state": "Andhra Pradesh",
                "postalCode": "533406",
                "country": "IN",
            }
        ],
        emailVerified=True,
        emailVerifiedAt=datetime.now(tz=timezone.utc),
    )
    await User.insert_many([admin_user, customer_user])

    jaggery_product = Product(
        name="Organic Palm Jaggery",
        slug="organic-palm-jaggery",
        description="Traditionally prepared jaggery sourced from Annavaram.",
        price=49900,
        stock=120,
        category="jaggery",
        images=[
            "https://raw.githubusercontent.com/hemanth8705/online_annavaram/main/client/public/telugu_snacks_images/snacks02.jpg"
        ],
    )
    ghee_product = Product(
        name="Cow Ghee 1L",
        slug="cow-ghee-1l",
        description="Rich aromatic ghee sourced from local dairy farms.",
        price=89900,
        stock=80,
        category="ghee",
        images=[
            "https://raw.githubusercontent.com/hemanth8705/online_annavaram/main/client/public/telugu_snacks_images/snacks01.jpg"
        ],
    )
    await Product.insert_many([jaggery_product, ghee_product])

    cart = Cart(user=customer_user.id, status="active")
    await cart.insert()

    cart_items = [
        CartItem(
            cart=cart.id,
            product=jaggery_product.id,
            quantity=2,
            priceAtAddition=jaggery_product.price,
        ),
        CartItem(
            cart=cart.id,
            product=ghee_product.id,
            quantity=1,
            priceAtAddition=ghee_product.price,
        ),
    ]
    await CartItem.insert_many(cart_items)

    total_amount = sum(item.priceAtAddition * item.quantity for item in cart_items)

    primary_address = customer_user.addresses[0].model_dump()
    shipping_address = {
        "name": customer_user.fullName,
        "phone": customer_user.phone,
        **primary_address,
    }

    order = Order(
        user=customer_user.id,
        cart=cart.id,
        totalAmount=total_amount,
        currency="INR",
        status="paid",
        shippingAddress=shipping_address,
        paymentIntentId="demo_intent_123",
        notes="Demo order created via seed script.",
    )
    await order.insert()

    order_items = [
        OrderItem(
            order=order.id,
            product=item.product,
            productName=(
                jaggery_product.name
                if item.product == jaggery_product.id
                else ghee_product.name
            ),
            unitPrice=item.priceAtAddition,
            quantity=item.quantity,
            subtotal=item.priceAtAddition * item.quantity,
        )
        for item in cart_items
    ]
    await OrderItem.insert_many(order_items)

    payment = Payment(
        order=order.id,
        gateway="razorpay",
        amount=total_amount,
        currency="INR",
        status="captured",
        transactionId="pay_demo_123",
        rawResponse={
            "id": "pay_demo_123",
            "status": "captured",
            "amount": total_amount,
        },
    )
    await payment.insert()

    return {
        "adminUser": admin_user,
        "customerUser": customer_user,
        "products": [jaggery_product, ghee_product],
        "cart": cart,
        "cartItems": cart_items,
        "order": order,
        "orderItems": order_items,
        "payment": payment,
    }


async def run_checks(context):
    products = await Product.find_all().to_list()
    print(
        f"Products available ({len(products)}):",
        [
            {"name": product.name, "pricePaise": product.price, "stock": product.stock}
            for product in products
        ],
    )

    cart_items = await CartItem.find(CartItem.cart == context["cart"].id).to_list()
    product_lookup = {str(p.id): p for p in context["products"]}
    cart_snapshot = []
    for item in cart_items:
        product = product_lookup.get(str(item.product))
        cart_snapshot.append(
            {
                "product": product.name if product else str(item.product),
                "quantity": item.quantity,
                "pricePaise": item.priceAtAddition,
            }
        )
    print(f"Cart {context['cart'].id} items:", cart_snapshot)

    orders = await Order.find(Order.user == context["customerUser"].id).to_list()
    print(
        f"Orders for {context['customerUser'].email}:",
        [
            {
                "totalAmount": order.totalAmount,
                "status": order.status,
                "createdAt": order.createdAt,
            }
            for order in orders
        ],
    )

    payments = await Payment.find(Payment.order == context["order"].id).to_list()
    print(
        f"Payments for order {context['order'].id}:",
        [
            {"gateway": payment.gateway, "status": payment.status, "amount": payment.amount}
            for payment in payments
        ],
    )


async def main():
    await connect_to_database()
    try:
        print("Connected to database. Clearing collections...")
        await clear_collections()
        print("Seeding sample data...")
        seeded = await seed_data()
        print("Sample data created successfully.")
        print("Running verification queries...")
        await run_checks(seeded)
        print("Seed script completed.")
    finally:
        await disconnect_from_database()


if __name__ == "__main__":
    asyncio.run(main())
