module.exports = {
  '/api/cart': {
    get: {
      tags: ['Cart'],
      summary: 'Get active cart',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Cart snapshot.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartResponse' },
            },
          },
        },
        401: {
          description: 'Authentication required.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/cart/items': {
    post: {
      tags: ['Cart'],
      summary: 'Add item to cart',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string', example: '67201bf9fbad4b6a5c3f08a2' },
                quantity: { type: 'integer', example: 2 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Cart updated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartResponse' },
            },
          },
        },
      },
    },
  },
  '/api/cart/items/{itemId}': {
    patch: {
      tags: ['Cart'],
      summary: 'Update cart item quantity',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['quantity'],
              properties: {
                quantity: { type: 'integer', example: 3 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Cart updated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Remove cart item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Cart updated.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartResponse' },
            },
          },
        },
      },
    },
  },
};
