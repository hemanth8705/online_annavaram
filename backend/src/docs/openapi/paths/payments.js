module.exports = {
  '/api/payments/razorpay/verify': {
    post: {
      tags: ['Payments'],
      summary: 'Verify Razorpay payment signature',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PaymentVerificationRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Payment verified and recorded.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      payment: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'captured' },
                          amount: { type: 'integer', example: 149700 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Signature mismatch or invalid payload.',
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
