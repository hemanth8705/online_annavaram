module.exports = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  schemas: {
    ApiError: {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid email or password.' },
        details: {
          type: 'object',
          nullable: true,
          description: 'Optional structured validation errors.',
          example: {
            field: 'email',
            message: 'Email already in use',
          },
        },
      },
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '671f2b8b9d1d27c8d12c0a61' },
        fullName: { type: 'string', example: 'Sita Lakshmi' },
        email: { type: 'string', format: 'email', example: 'sita@example.com' },
        phone: { type: 'string', nullable: true, example: '9999999901' },
        role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
        emailVerified: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2025-10-25T11:20:45.102Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-10-27T09:10:12.512Z' },
      },
    },
    SessionSummary: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '67203456893a8b34f0ab9051' },
        expiresAt: { type: 'string', format: 'date-time', example: '2025-11-24T09:15:30.000Z' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-10-27T09:15:30.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-10-27T09:15:30.000Z' },
      },
    },
    AuthSuccessResponse: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Login successful.' },
        data: {
          type: 'object',
          required: ['accessToken', 'accessTokenExpiresAt', 'session', 'user'],
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token. Include as `Authorization: Bearer <token>` on protected requests.',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            accessTokenExpiresAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-27T09:45:30.000Z',
            },
            session: { $ref: '#/components/schemas/SessionSummary' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
    Product: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '67201bf9fbad4b6a5c3f08a2' },
        name: { type: 'string', example: 'Organic Palm Jaggery' },
        slug: { type: 'string', example: 'organic-palm-jaggery' },
        description: {
          type: 'string',
          example: 'Traditionally prepared jaggery sourced from Annavaram.',
        },
        price: { type: 'integer', example: 49900, description: 'Price stored in paise.' },
        currency: { type: 'string', example: 'INR' },
        stock: { type: 'integer', example: 120 },
        category: { type: 'string', example: 'jaggery' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
          example: ['https://cdn.example.com/images/products/jaggery-1.jpg'],
        },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2025-10-12T12:18:44.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-10-26T10:05:12.000Z' },
      },
    },
    ProductListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' },
            },
          },
        },
      },
    },
    CartItem: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '67202967be90cf3d5d7fa11a' },
        product: { $ref: '#/components/schemas/Product' },
        quantity: { type: 'integer', example: 2 },
        subtotal: { type: 'integer', example: 99800 },
      },
    },
    CartSnapshot: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/CartItem' },
        },
        totals: {
          type: 'object',
          properties: {
            itemCount: { type: 'integer', example: 2 },
            subtotal: { type: 'integer', example: 99800 },
          },
        },
      },
    },
    CartResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '67202878b571f76c954b2d45' },
            status: { type: 'string', example: 'active' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            totals: {
              type: 'object',
              properties: {
                itemCount: { type: 'integer', example: 3 },
                subtotal: { type: 'integer', example: 149700 },
              },
            },
          },
        },
      },
    },
    ShippingAddress: {
      type: 'object',
      required: ['name', 'line1', 'city', 'state', 'postalCode', 'country'],
      properties: {
        name: { type: 'string', example: 'Sita Lakshmi' },
        phone: { type: 'string', nullable: true, example: '9999999901' },
        line1: { type: 'string', example: '12-34 Main Road' },
        line2: { type: 'string', nullable: true, example: 'Near Temple Street' },
        city: { type: 'string', example: 'Annavaram' },
        state: { type: 'string', example: 'Andhra Pradesh' },
        postalCode: { type: 'string', example: '533406' },
        country: { type: 'string', example: 'IN' },
      },
    },
    Order: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '67202a44c6f9e21692b28be4' },
        status: { type: 'string', example: 'pending' },
        totalAmount: { type: 'integer', example: 149700 },
        currency: { type: 'string', example: 'INR' },
        shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
        createdAt: { type: 'string', format: 'date-time', example: '2025-10-27T09:18:44.000Z' },
      },
    },
    OrderListResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: { $ref: '#/components/schemas/Order' },
            },
          },
        },
      },
    },
    PaymentVerificationRequest: {
      type: 'object',
      required: ['orderId', 'paymentId', 'signature'],
      properties: {
        orderId: { type: 'string', example: 'order_Ot1FeR2b6Hw9xX' },
        paymentId: { type: 'string', example: 'pay_Ot1FxC11Nn8QjP' },
        signature: { type: 'string', example: 'generated-razorpay-signature' },
      },
    },
  },
};
