module.exports = {
  '/api/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Create order from active cart',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['shippingAddress'],
              properties: {
                shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
                notes: { type: 'string', example: 'Please deliver between 5-6PM' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Order created.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      order: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    get: {
      tags: ['Orders'],
      summary: 'List current user orders',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Order history.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderListResponse' },
            },
          },
        },
      },
    },
  },
  '/api/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Get specific order',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Order details.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      order: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Order not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
};
