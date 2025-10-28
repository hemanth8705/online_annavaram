module.exports = {
  '/api/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Create account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fullName', 'email', 'password'],
              properties: {
                fullName: { type: 'string', example: 'Sita Lakshmi' },
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
                password: { type: 'string', format: 'password', example: 'StrongPass!123' },
                phone: { type: 'string', example: '9999999901' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Account created. OTP sent for email verification.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
              examples: {
                default: {
                  value: {
                    success: true,
                    message: 'Signup successful. Please verify your email using the OTP sent to your inbox.',
                  },
                },
              },
            },
          },
        },
        409: {
          description: 'Email already registered.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login and start session',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
                password: { type: 'string', format: 'password', example: 'demo-password' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful. Access token returned, refresh token set as HttpOnly cookie.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
            },
          },
        },
        401: {
          description: 'Invalid credentials.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        403: {
          description: 'Email not verified.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Requires the `refreshToken` HttpOnly cookie set during login.',
      responses: {
        200: {
          description: 'Session refreshed successfully.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
            },
          },
        },
        401: {
          description: 'Refresh token invalid or expired.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout current session',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Session revoked and refresh cookie cleared.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
              examples: {
                default: {
                  value: {
                    success: true,
                    message: 'Logged out successfully.',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Access token missing or invalid.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/logout-all': {
    post: {
      tags: ['Auth'],
      summary: 'Logout from all sessions',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'All active sessions revoked.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
              examples: {
                default: {
                  value: {
                    success: true,
                    message: 'All sessions revoked successfully.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Authenticated user profile.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Access token missing or invalid.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/verify-email': {
    post: {
      tags: ['Auth'],
      summary: 'Verify email using OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'otp'],
              properties: {
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
                otp: { type: 'string', example: '123456' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Email verified.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
              examples: {
                default: {
                  value: {
                    success: true,
                    message: 'Email verified successfully.',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid OTP supplied.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },
  '/api/auth/resend-otp': {
    post: {
      tags: ['Auth'],
      summary: 'Resend verification OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'OTP resent.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Reset OTP sent if account exists.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password using OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'otp', 'newPassword'],
              properties: {
                email: { type: 'string', format: 'email', example: 'sita@example.com' },
                otp: { type: 'string', example: '123456' },
                newPassword: { type: 'string', format: 'password', example: 'NewStrongPass!123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password reset successfully.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};
