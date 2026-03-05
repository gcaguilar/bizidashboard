export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Bizi Dashboard API',
    version: '0.5.0',
    description:
      'API endpoints for station status, rankings, alerts, patterns, heatmaps, and mobility.'
  },
  paths: {
    '/api/status': {
      get: {
        operationId: 'get_status',
        summary: 'Get pipeline status and observability metrics',
        responses: {
          200: {
            description: 'Pipeline and system status payload'
          }
        }
      }
    },
    '/api/stations': {
      get: {
        operationId: 'get_stations',
        summary: 'List stations with latest availability snapshot',
        responses: {
          200: {
            description: 'Stations payload with generatedAt'
          }
        }
      }
    },
    '/api/rankings': {
      get: {
        operationId: 'get_rankings',
        summary: 'Get station rankings by turnover or availability',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            description: 'Ranking type to return',
            schema: {
              type: 'string',
              enum: ['turnover', 'availability']
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of rows',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        ],
        responses: {
          200: {
            description: 'Rankings payload'
          }
        }
      }
    },
    '/api/alerts': {
      get: {
        operationId: 'get_alerts',
        summary: 'List active alerts',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of alerts',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              default: 50
            }
          }
        ],
        responses: {
          200: {
            description: 'Alerts payload'
          }
        }
      }
    },
    '/api/patterns': {
      get: {
        operationId: 'get_patterns',
        summary: 'Get weekday/weekend hourly patterns for one station',
        parameters: [
          {
            name: 'stationId',
            in: 'query',
            required: true,
            description: 'Station identifier',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Pattern rows'
          }
        }
      }
    },
    '/api/heatmap': {
      get: {
        operationId: 'get_heatmap',
        summary: 'Get occupancy heatmap cells for one station',
        parameters: [
          {
            name: 'stationId',
            in: 'query',
            required: true,
            description: 'Station identifier',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Heatmap rows'
          }
        }
      }
    },
    '/api/mobility': {
      get: {
        operationId: 'get_mobility',
        summary: 'Get mobility signals and demand curve',
        parameters: [
          {
            name: 'mobilityDays',
            in: 'query',
            required: false,
            description: 'Lookback days for hourly mobility signals',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 90,
              default: 14
            }
          },
          {
            name: 'demandDays',
            in: 'query',
            required: false,
            description: 'Lookback days for daily demand curve',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 120,
              default: 30
            }
          }
        ],
        responses: {
          200: {
            description: 'Mobility payload'
          }
        }
      }
    },
    '/api/history': {
      get: {
        operationId: 'get_history',
        summary: 'Get full historical demand data since first record',
        responses: {
          200: {
            description: 'Historical coverage metadata and daily history'
          }
        }
      }
    },
    '/api/collect': {
      get: {
        operationId: 'get_collect',
        summary: 'Get collection job state',
        responses: {
          200: {
            description: 'Collector state payload'
          }
        }
      },
      post: {
        operationId: 'post_collect',
        summary: 'Trigger one data collection run',
        responses: {
          200: {
            description: 'Collection execution payload'
          }
        }
      }
    },
    '/api/docs': {
      get: {
        operationId: 'get_api_docs',
        summary: 'Get OpenAPI document (compatibility endpoint)',
        responses: {
          200: {
            description: 'OpenAPI document'
          }
        }
      }
    },
    '/api/openapi.json': {
      get: {
        operationId: 'get_openapi_json',
        summary: 'Get OpenAPI document',
        responses: {
          200: {
            description: 'OpenAPI document'
          }
        }
      }
    }
  }
} as const
