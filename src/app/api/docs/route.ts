import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const openApiDocument = {
  openapi: '3.2.0',
  info: {
    title: 'Bizi Dashboard API',
    version: '0.4.0',
    description:
      'API endpoints for station status, rankings, patterns, heatmap data, and alerts.'
  },
  paths: {
    '/api/stations': {
      get: {
        summary: 'List stations with latest status',
        responses: {
          200: {
            description: 'Station list with latest availability data',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/StationStatus' }
                }
              }
            }
          },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },
    '/api/rankings': {
      get: {
        summary: 'Get station rankings',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['turnover', 'availability'] },
            description: 'Ranking type to return'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Maximum number of rows to return'
          }
        ],
        responses: {
          200: {
            description: 'Ranked station list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Ranking' }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },
    '/api/patterns': {
      get: {
        summary: 'Get weekday/weekend hourly patterns for a station',
        parameters: [
          {
            name: 'stationId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Station identifier'
          }
        ],
        responses: {
          200: {
            description: 'Pattern rows by day type and hour',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/StationPattern' }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },
    '/api/heatmap': {
      get: {
        summary: 'Get occupancy heatmap cells for a station',
        parameters: [
          {
            name: 'stationId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Station identifier'
          }
        ],
        responses: {
          200: {
            description: 'Heatmap cells by day of week and hour',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/HeatmapCell' }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    },
    '/api/alerts': {
      get: {
        summary: 'Get active station alerts',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 200 },
            description: 'Maximum number of alerts to return'
          }
        ],
        responses: {
          200: {
            description: 'Alert list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Alert' }
                }
              }
            }
          },
          500: { $ref: '#/components/responses/InternalError' }
        }
      }
    }
  },
  components: {
    responses: {
      BadRequest: {
        description: 'Invalid request parameters',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
        }
      },
      InternalError: {
        description: 'Unexpected server error',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
        }
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      },
      StationStatus: {
        type: 'object',
        required: [
          'id',
          'name',
          'lat',
          'lon',
          'capacity',
          'bikesAvailable',
          'anchorsFree',
          'recordedAt'
        ],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          lat: { type: 'number' },
          lon: { type: 'number' },
          capacity: { type: 'integer' },
          bikesAvailable: { type: 'integer' },
          anchorsFree: { type: 'integer' },
          recordedAt: { type: 'string', format: 'date-time' }
        }
      },
      Ranking: {
        type: 'object',
        required: [
          'id',
          'stationId',
          'turnoverScore',
          'emptyHours',
          'fullHours',
          'totalHours',
          'windowStart',
          'windowEnd'
        ],
        properties: {
          id: { type: 'integer' },
          stationId: { type: 'string' },
          turnoverScore: { type: 'number' },
          emptyHours: { type: 'number' },
          fullHours: { type: 'number' },
          totalHours: { type: 'number' },
          windowStart: { type: 'string' },
          windowEnd: { type: 'string' }
        }
      },
      StationPattern: {
        type: 'object',
        required: [
          'stationId',
          'dayType',
          'hour',
          'bikesAvg',
          'anchorsAvg',
          'occupancyAvg',
          'sampleCount'
        ],
        properties: {
          stationId: { type: 'string' },
          dayType: { type: 'string', enum: ['weekday', 'weekend'] },
          hour: { type: 'integer', minimum: 0, maximum: 23 },
          bikesAvg: { type: 'number' },
          anchorsAvg: { type: 'number' },
          occupancyAvg: { type: 'number' },
          sampleCount: { type: 'integer' }
        }
      },
      HeatmapCell: {
        type: 'object',
        required: [
          'stationId',
          'dayOfWeek',
          'hour',
          'bikesAvg',
          'anchorsAvg',
          'occupancyAvg',
          'sampleCount'
        ],
        properties: {
          stationId: { type: 'string' },
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
          hour: { type: 'integer', minimum: 0, maximum: 23 },
          bikesAvg: { type: 'number' },
          anchorsAvg: { type: 'number' },
          occupancyAvg: { type: 'number' },
          sampleCount: { type: 'integer' }
        }
      },
      Alert: {
        type: 'object',
        required: [
          'id',
          'stationId',
          'alertType',
          'severity',
          'metricValue',
          'windowHours',
          'generatedAt',
          'isActive'
        ],
        properties: {
          id: { type: 'integer' },
          stationId: { type: 'string' },
          alertType: { type: 'string' },
          severity: { type: 'number' },
          metricValue: { type: 'number' },
          windowHours: { type: 'number' },
          generatedAt: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(openApiDocument, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
