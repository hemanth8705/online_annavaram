# Database Schema — Online Annavaram

## Overview
- Database: MongoDB (document oriented)
- ODM: Mongoose
- Naming: singular model names; collections use Mongoose pluralisation

## Entity Relationships
- A `User` can own many `Cart` and many `Order` documents.
- A `Cart` contains multiple `CartItem` documents.
- An `Order` contains multiple `OrderItem` documents.
- Each `CartItem`/`OrderItem` references exactly one `Product`.
- Each `Payment` references exactly one `Order`.

## Collections

### Users
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `fullName` | String | Yes | — | Trimmed |
| `email` | String | Yes | — | Lowercased, unique |
| `passwordHash` | String | Yes | — | Store hashed value |
| `phone` | String | No | — | Optional contact |
| `role` | String | Yes | `"customer"` | Enum: `customer`, `admin` |
| `addresses` | [Subdoc] | No | `[]` | Shipping addresses |
| `isActive` | Boolean | Yes | `true` | Soft deactivate flag |
| `emailVerified` | Boolean | Yes | `false` | Set `true` after OTP verification |
| `emailVerifiedAt` | Date | No | — | Timestamp of successful verification |
| `emailVerification` | Subdoc | No | `{ attempts: 0, sentHistory: [] }` | Stores OTP hash, expiry, attempts, send history |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

Address subdocument:
- `label` (String, optional)
- `line1` (String, required)
- `line2` (String, optional)
- `city` (String, required)
- `state` (String, required)
- `postalCode` (String, required)
- `country` (String, required, default `IN`)

Email verification subdocument:
- `otpHash` (String, hashed OTP)
- `otpExpiresAt` (Date, expiry timestamp)
- `attempts` (Number, increments on failed verify)
- `sentHistory` (Array\<Date\>, timestamps of OTP sends for rate limiting)

### Products
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `name` | String | Yes | — | Trimmed |
| `slug` | String | Yes | — | Lowercase, unique |
| `description` | String | No | — | Long form text |
| `price` | Number | Yes | — | Integer paise |
| `currency` | String | Yes | `"INR"` | ISO code |
| `stock` | Number | Yes | `0` | Units on hand |
| `category` | String | No | — | e.g. `jaggery` |
| `images` | [String] | No | `[]` | Image URLs |
| `isActive` | Boolean | Yes | `true` | Listing toggle |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

### Carts
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `user` | ObjectId → Users | Yes | — | Owner reference |
| `status` | String | Yes | `"active"` | Enum: `active`, `converted`, `abandoned` |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

### Cart Items
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `cart` | ObjectId → Carts | Yes | — | Parent cart |
| `product` | ObjectId → Products | Yes | — | Product reference |
| `quantity` | Number | Yes | `1` | Min 1 |
| `priceAtAddition` | Number | Yes | — | Snapshot price (paise) |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

### Orders
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `user` | ObjectId → Users | Yes | — | Buyer |
| `cart` | ObjectId → Carts | No | — | Source cart (optional) |
| `totalAmount` | Number | Yes | — | Integer paise |
| `currency` | String | Yes | `"INR"` | ISO code |
| `status` | String | Yes | `"pending_payment"` | Enum: `pending_payment`, `pending`, `paid`, `shipped`, `delivered`, `cancelled` |
| `shippingAddress` | Subdoc | Yes | — | Snapshot for delivery |
| `paymentIntentId` | String | No | — | Gateway reference |
| `notes` | String | No | — | Internal notes |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

Shipping address subdocument mirrors the user address schema.

### Order Items
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `order` | ObjectId → Orders | Yes | — | Parent order |
| `product` | ObjectId → Products | Yes | — | Product reference |
| `productName` | String | Yes | — | Snapshot name |
| `unitPrice` | Number | Yes | — | Paise |
| `quantity` | Number | Yes | `1` | Min 1 |
| `subtotal` | Number | Yes | — | unitPrice × quantity |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

### Payments
| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `order` | ObjectId → Orders | Yes | — | Linked order |
| `gateway` | String | Yes | — | e.g. `razorpay`, `manual` |
| `amount` | Number | Yes | — | Integer paise |
| `currency` | String | Yes | `"INR"` | ISO code |
| `status` | String | Yes | `"initiated"` | Enum: `initiated`, `authorized`, `captured`, `failed`, `refunded` |
| `transactionId` | String | No | — | Gateway identifier |
| `rawResponse` | Mixed | No | — | Payload snapshot |
| `createdAt` | Date | Yes | Now | Timestamp |
| `updatedAt` | Date | Yes | Now | Timestamp |

## Indexes
- `Users.email` unique index
- `Products.slug` unique index
- Foreign key fields (`user`, `cart`, `product`, `order`) indexed via `ref` declarations

## Notes
- Monetary values stored in integer paise to avoid floating point drift.
- `rawResponse` retains payment gateway payloads.
- Order/cart items duplicate select product fields to preserve purchase-time state.
