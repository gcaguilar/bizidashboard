export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Bizi Dashboard API',
    version: '0.5.0',
    description:
      'API endpoints for station status, rankings, alerts, patterns, heatmaps, mobility, and transit impact.'
  },
  components: {
    securitySchemes: {
      OpsApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-ops-api-key',
        description:
          'Required for GET/POST /api/collect. x-collect-api-key is accepted temporarily as a compatibility alias.'
      },
      PublicApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-public-api-key',
        description:
          'Required for elevated access to expensive public endpoints and CSV exports.'
      },
    }
  },
  paths: {
    '/api/health/live': {
      get: {
        operationId: 'get_health_live',
        summary: 'Liveness probe (no dependencies)',
        responses: {
          200: {
            description: 'Process is alive'
          }
        }
      }
    },
    '/api/health/ready': {
      get: {
        operationId: 'get_health_ready',
        summary: 'Readiness probe (checks database connectivity)',
        responses: {
          200: {
            description: 'Service is ready to serve traffic'
          },
          503: {
            description: 'Service dependencies are not ready'
          }
        }
      }
    },
    '/api/status': {
      get: {
        operationId: 'get_status',
        summary: 'Get pipeline observability metrics',
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
    '/api/alerts/history': {
      get: {
        operationId: 'get_alerts_history',
        summary: 'List alert history with filters, pagination, and CSV export',
        parameters: [
          {
            name: 'state',
            in: 'query',
            required: false,
            description: 'Filter by alert state',
            schema: {
              type: 'string',
              enum: ['all', 'active', 'resolved'],
              default: 'all'
            }
          },
          {
            name: 'stationId',
            in: 'query',
            required: false,
            description: 'Filter by station identifier',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'alertType',
            in: 'query',
            required: false,
            description: 'Filter by alert type',
            schema: {
              type: 'string',
              enum: ['all', 'LOW_BIKES', 'LOW_ANCHORS'],
              default: 'all'
            }
          },
          {
            name: 'severity',
            in: 'query',
            required: false,
            description: 'Filter by severity (1=media, 2=critica)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 5
            }
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            description: 'Start datetime (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time'
            }
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            description: 'End datetime (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time'
            }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Rows per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 2000,
              default: 200
            }
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            description: 'Pagination offset',
            schema: {
              type: 'integer',
              minimum: 0,
              maximum: 20000,
              default: 0
            }
          },
          {
            name: 'format',
            in: 'query',
            required: false,
            description: 'Response format',
            schema: {
              type: 'string',
              enum: ['json', 'csv'],
              default: 'json'
            }
          }
        ],
        responses: {
          200: {
            description: 'Alert history payload or CSV file'
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
        summary: 'Get mobility signals, demand curve, and transit impact',
        parameters: [
          {
            name: 'mobilityDays',
            in: 'query',
            required: false,
            description: 'Lookback days for hourly mobility signals',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 365,
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
              maximum: 365,
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
        security: [
          {
            OpsApiKey: []
          }
        ],
        responses: {
          200: {
            description: 'Collector state payload'
          }
        }
      },
      post: {
        operationId: 'post_collect',
        summary: 'Trigger one data collection run',
        security: [
          {
            OpsApiKey: []
          }
        ],
        responses: {
          200: {
            description: 'Collection execution payload'
          },
          401: {
            description: 'Missing or invalid API key'
          },
          429: {
            description: 'Rate limit exceeded'
          },
          503: {
            description: 'Collect trigger endpoint misconfigured'
          }
        }
      }
    },
    '/api/rebalancing-report': {
      get: {
        operationId: 'get_rebalancing_report',
        summary: 'Station rebalancing diagnostic report with classification, predictions, and transfer recommendations',
        description: 'Returns a full rebalancing report: station diagnostics classified A-F (overstock, deficit, peak_saturation, peak_emptying, balanced, data_review), risk predictions at 1h/3h, network elasticity context, origin-destination transfer recommendations, KPIs, and baseline comparison. Filterable by barrio/district.',
        parameters: [
          {
            name: 'district',
            in: 'query',
            required: false,
            description: 'Filter results by barrio/district name (e.g. "Centro", "Delicias")',
            schema: { type: 'string' }
          },
          {
            name: 'days',
            in: 'query',
            required: false,
            description: 'Analysis window in days (default 15, max 90)',
            schema: { type: 'integer', minimum: 1, maximum: 90, default: 15 }
          },
          {
            name: 'format',
            in: 'query',
            required: false,
            description: 'Response format: json (default) or csv',
            schema: { type: 'string', enum: ['json', 'csv'] }
          }
        ],
        responses: {
          200: {
            description: 'Rebalancing report with station diagnostics (classification A-F), transfer recommendations, KPIs, and baseline comparison'
          },
          400: {
            description: 'Invalid query parameters'
          },
          500: {
            description: 'Internal server error'
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
