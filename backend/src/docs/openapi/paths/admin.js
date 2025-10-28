module.exports = {
  '/api/admin/orders': {
    get: {
      tags: ['Admin'],
      summary: 'List all orders (admin only)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'All orders.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderListResponse' },
            },
          },
        },
        403: {
          description: 'Admin role required.',
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
