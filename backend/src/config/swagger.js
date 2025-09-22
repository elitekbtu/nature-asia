const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nature Asia API',
      version: '1.0.0',
      description: 'Backend API for Nature Asia disaster monitoring and V2V communication system',
      contact: {
        name: 'Nature Asia Team',
        email: 'support@nature-asia.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.nature-asia.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID Token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            uid: {
              type: 'string',
              example: 'firebase-user-id'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            picture: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/avatar.jpg'
            },
            emailVerified: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time'
            },
            preferences: {
              type: 'object',
              properties: {
                notifications: {
                  type: 'boolean',
                  example: true
                },
                language: {
                  type: 'string',
                  example: 'en'
                },
                region: {
                  type: 'string',
                  example: 'asia'
                }
              }
            }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              example: 'vehicle-123'
            },
            vehicleType: {
              type: 'string',
              enum: ['car', 'truck', 'motorcycle', 'bus', 'emergency'],
              example: 'car'
            },
            make: {
              type: 'string',
              example: 'Toyota'
            },
            model: {
              type: 'string',
              example: 'Camry'
            },
            year: {
              type: 'integer',
              minimum: 1900,
              example: 2023
            },
            location: {
              type: 'object',
              properties: {
                latitude: {
                  type: 'number',
                  minimum: -90,
                  maximum: 90,
                  example: 35.6762
                },
                longitude: {
                  type: 'number',
                  minimum: -180,
                  maximum: 180,
                  example: 139.6503
                },
                heading: {
                  type: 'number',
                  minimum: 0,
                  maximum: 360,
                  example: 45
                },
                speed: {
                  type: 'number',
                  minimum: 0,
                  example: 60
                }
              }
            },
            userId: {
              type: 'string',
              example: 'firebase-user-id'
            },
            ownerEmail: {
              type: 'string',
              format: 'email',
              example: 'owner@example.com'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Disaster: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'disaster-123'
            },
            type: {
              type: 'string',
              enum: ['earthquake', 'weather', 'tsunami', 'volcanic'],
              example: 'earthquake'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'high'
            },
            title: {
              type: 'string',
              example: 'Earthquake in Tokyo'
            },
            description: {
              type: 'string',
              example: 'Magnitude 6.5 earthquake detected'
            },
            location: {
              type: 'object',
              properties: {
                latitude: {
                  type: 'number',
                  example: 35.6762
                },
                longitude: {
                  type: 'number',
                  example: 139.6503
                },
                address: {
                  type: 'string',
                  example: 'Tokyo, Japan'
                }
              }
            },
            magnitude: {
              type: 'number',
              example: 6.5
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            source: {
              type: 'string',
              example: 'USGS'
            },
            affectedArea: {
              type: 'object',
              properties: {
                radius: {
                  type: 'number',
                  example: 50
                },
                population: {
                  type: 'integer',
                  example: 1000000
                }
              }
            }
          }
        },
        V2VMessage: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              example: 'msg-123'
            },
            senderVehicleId: {
              type: 'string',
              example: 'vehicle-123'
            },
            targetVehicleId: {
              type: 'string',
              example: 'vehicle-456'
            },
            message: {
              type: 'string',
              example: 'Traffic jam ahead, consider alternative route'
            },
            type: {
              type: 'string',
              enum: ['info', 'warning', 'emergency'],
              example: 'info'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'medium'
            },
            aiEnhanced: {
              type: 'boolean',
              example: true
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            senderInfo: {
              type: 'object',
              properties: {
                vehicleId: {
                  type: 'string',
                  example: 'vehicle-123'
                },
                userId: {
                  type: 'string',
                  example: 'firebase-user-id'
                }
              }
            }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  example: 150
                },
                recent24h: {
                  type: 'integer',
                  example: 12
                },
                byType: {
                  type: 'object',
                  properties: {
                    earthquake: {
                      type: 'integer',
                      example: 8
                    },
                    weather: {
                      type: 'integer',
                      example: 3
                    },
                    tsunami: {
                      type: 'integer',
                      example: 1
                    },
                    volcanic: {
                      type: 'integer',
                      example: 0
                    }
                  }
                }
              }
            },
            severity: {
              type: 'object',
              properties: {
                overall: {
                  type: 'object',
                  properties: {
                    low: {
                      type: 'integer',
                      example: 5
                    },
                    medium: {
                      type: 'integer',
                      example: 4
                    },
                    high: {
                      type: 'integer',
                      example: 2
                    },
                    critical: {
                      type: 'integer',
                      example: 1
                    }
                  }
                }
              }
            },
            geographic: {
              type: 'object',
              properties: {
                regions: {
                  type: 'object',
                  additionalProperties: {
                    type: 'integer'
                  }
                },
                hotspots: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        example: 'Tokyo, Japan'
                      },
                      count: {
                        type: 'integer',
                        example: 15
                      },
                      severity: {
                        type: 'string',
                        example: 'high'
                      }
                    }
                  }
                }
              }
            },
            trends: {
              type: 'object',
              properties: {
                daily: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'integer'
                      },
                      byType: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            },
            predictions: {
              type: 'object',
              properties: {
                next24h: {
                  type: 'object',
                  properties: {
                    probability: {
                      type: 'number',
                      example: 0.75
                    },
                    confidence: {
                      type: 'string',
                      enum: ['low', 'medium', 'high'],
                      example: 'medium'
                    }
                  }
                },
                next7d: {
                  type: 'object',
                  properties: {
                    probability: {
                      type: 'number',
                      example: 0.85
                    },
                    confidence: {
                      type: 'string',
                      enum: ['low', 'medium', 'high'],
                      example: 'high'
                    }
                  }
                }
              }
            }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'chat-123'
            },
            userId: {
              type: 'string',
              example: 'firebase-user-id'
            },
            message: {
              type: 'string',
              example: 'What should I do during an earthquake?'
            },
            response: {
              type: 'string',
              example: 'During an earthquake, drop, cover, and hold on...'
            },
            type: {
              type: 'string',
              enum: ['chat', 'disaster_analysis', 'emergency_plan'],
              example: 'chat'
            },
            context: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  example: 'Tokyo, Japan'
                },
                disasterType: {
                  type: 'string',
                  example: 'earthquake'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        EmergencyPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'plan-123'
            },
            disasterType: {
              type: 'string',
              enum: ['earthquake', 'tsunami', 'volcanic', 'weather'],
              example: 'earthquake'
            },
            location: {
              type: 'string',
              example: 'Tokyo, Japan'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'high'
            },
            plan: {
              type: 'object',
              properties: {
                immediateActions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['Evacuate to designated safe zones', 'Activate emergency services']
                },
                shortTermActions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['Assess damage', 'Set up emergency shelters']
                },
                longTermActions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['Rebuild infrastructure', 'Provide psychological support']
                },
                resources: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['Emergency medical teams', 'Heavy machinery', 'Food supplies']
                },
                timeline: {
                  type: 'object',
                  properties: {
                    immediate: {
                      type: 'string',
                      example: '0-2 hours'
                    },
                    shortTerm: {
                      type: 'string',
                      example: '2-48 hours'
                    },
                    longTerm: {
                      type: 'string',
                      example: '48+ hours'
                    }
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        SafetyRecommendation: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              example: 'immediate'
            },
            action: {
              type: 'string',
              example: 'Drop, cover, and hold on'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'high'
            },
            description: {
              type: 'string',
              example: 'Get under a sturdy table and hold on until shaking stops'
            }
          }
        },
        V2VStats: {
          type: 'object',
          properties: {
            totalVehicles: {
              type: 'integer',
              description: 'Total number of registered vehicles',
              example: 1250
            },
            activeVehicles: {
              type: 'integer',
              description: 'Number of currently active vehicles',
              example: 890
            },
            totalMessages: {
              type: 'integer',
              description: 'Total number of V2V messages sent',
              example: 15600
            },
            messagesLast24h: {
              type: 'integer',
              description: 'Messages sent in the last 24 hours',
              example: 450
            },
            emergencyMessages: {
              type: 'integer',
              description: 'Number of emergency messages broadcast',
              example: 12
            },
            averageResponseTime: {
              type: 'number',
              description: 'Average response time in milliseconds',
              example: 150.5
            },
            byVehicleType: {
              type: 'object',
              properties: {
                car: {
                  type: 'integer',
                  example: 800
                },
                truck: {
                  type: 'integer',
                  example: 200
                },
                emergency: {
                  type: 'integer',
                  example: 50
                }
              }
            },
            geographicDistribution: {
              type: 'object',
              additionalProperties: {
                type: 'integer'
              },
              example: {
                'Tokyo': 300,
                'Osaka': 250,
                'Kyoto': 150
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const specs = swaggerJSDoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b82f6; font-size: 2.5rem; font-weight: 700; }
    .swagger-ui .info .description { font-size: 1.1rem; color: #6b7280; margin: 10px 0; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .swagger-ui .opblock { border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6; }
    .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
    .swagger-ui .opblock-summary { padding: 15px; }
    .swagger-ui .opblock-description-wrapper { padding: 15px; }
    .swagger-ui .btn { border-radius: 6px; font-weight: 500; }
    .swagger-ui .btn.execute { background: #3b82f6; border-color: #3b82f6; }
    .swagger-ui .btn.execute:hover { background: #2563eb; border-color: #2563eb; }
    .swagger-ui .response-col_status { font-weight: 600; }
    .swagger-ui .response-col_description__inner { font-size: 0.9rem; }
    .swagger-ui .parameter__name { font-weight: 600; color: #374151; }
    .swagger-ui .parameter__type { color: #6b7280; }
    .swagger-ui .model { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .swagger-ui .model-title { color: #3b82f6; font-weight: 600; }
    .swagger-ui .prop-name { color: #374151; font-weight: 600; }
    .swagger-ui .prop-type { color: #6b7280; }
    .swagger-ui .prop-format { color: #9ca3af; }
    .swagger-ui .response-col_status-200 { color: #10b981; }
    .swagger-ui .response-col_status-400 { color: #f59e0b; }
    .swagger-ui .response-col_status-401 { color: #ef4444; }
    .swagger-ui .response-col_status-404 { color: #ef4444; }
    .swagger-ui .response-col_status-500 { color: #ef4444; }
    .swagger-ui .auth-wrapper { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .swagger-ui .auth-container { background: white; border-radius: 6px; padding: 15px; }
    .swagger-ui .auth-btn-wrapper { margin-top: 10px; }
    .swagger-ui .auth-btn-wrapper .btn { background: #3b82f6; border-color: #3b82f6; color: white; }
    .swagger-ui .auth-btn-wrapper .btn:hover { background: #2563eb; border-color: #2563eb; }
    .swagger-ui .auth-container h4 { color: #374151; margin-bottom: 10px; }
    .swagger-ui .auth-container p { color: #6b7280; font-size: 0.9rem; }
    .swagger-ui .info .base-url { color: #6b7280; font-size: 0.9rem; }
    .swagger-ui .info .base-url strong { color: #374151; }
    .swagger-ui .info .servers { margin: 15px 0; }
    .swagger-ui .info .servers .server { background: #f8fafc; padding: 10px; border-radius: 6px; margin: 5px 0; }
    .swagger-ui .info .servers .server .url { color: #3b82f6; font-weight: 600; }
    .swagger-ui .info .servers .server .description { color: #6b7280; font-size: 0.9rem; }
  `,
  customSiteTitle: 'Nature Asia API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add custom headers or modify requests
      req.headers['X-Requested-With'] = 'XMLHttpRequest';
      return req;
    },
    responseInterceptor: (res) => {
      // Handle responses
      return res;
    },
    onComplete: () => {
      // Custom initialization after Swagger UI loads
      console.log('Nature Asia API Documentation loaded successfully');
    },
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    validatorUrl: null, // Disable external validator
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayOperationId: false,
    showRequestHeaders: true,
    showCommonExtensions: true,
    deepLinking: true,
    layout: 'StandaloneLayout',
    plugins: [
      // Custom plugins can be added here
    ]
  }
};

module.exports = {
  swaggerUi,
  specs,
  swaggerOptions
};
