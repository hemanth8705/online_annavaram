module.exports = {
  '/api/test': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      description: 'Returns service health and database connectivity information.',
      responses: {
        200: {
          description: 'Service reachable.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  database: { type: 'string', enum: ['disconnected', 'connected', 'connecting', 'disconnecting', 'unknown'] },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
              examples: {
                default: {
                  value: {
                    message: 'Test endpoint is working',
                    database: 'connected',
                    timestamp: '2025-10-27T09:00:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
