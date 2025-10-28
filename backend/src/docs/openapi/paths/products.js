module.exports = {
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'List products',
      responses: {
        200: {
          description: 'Product catalogue.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductListResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Create product (admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Product' },
            examples: {
              default: {
                value: {
                  name: 'Premium Cashew Halwa',
                  slug: 'premium-cashew-halwa',
                  description: 'Silky halwa made with roasted cashews and ghee.',
                  price: 34900,
                  currency: 'INR',
                  stock: 50,
                  category: 'sweets',
                  images: ['https://cdn.example.com/images/products/cashew-halwa.jpg'],
                  isActive: true,
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Product created.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      product: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Admin access required.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get product by ID',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Product data.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      product: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Product not found.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
    put: {
      tags: ['Products'],
      summary: 'Update product (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Product' },
          },
        },
      },
      responses: {
        200: {
          description: 'Product updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      product: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Products'],
      summary: 'Delete product (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      ],
      responses: {
        204: { description: 'Product deleted.' },
        404: {
          description: 'Product not found.',
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
