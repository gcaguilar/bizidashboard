import { randomUUID } from 'node:crypto'
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  createDashboardMcpServer,
  resolveDashboardMcpRuntimeConfig
} from './tools'

const DEFAULT_HTTP_HOST = '0.0.0.0'
const DEFAULT_HTTP_PORT = 3333

type SessionState = {
  transport: StreamableHTTPServerTransport
  server: McpServer
}

function parsePort(rawValue: string | undefined): number {
  if (!rawValue) {
    return DEFAULT_HTTP_PORT
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    return DEFAULT_HTTP_PORT
  }

  return parsed
}

function getHeaderValue(
  headers: IncomingMessage['headers'],
  key: string
): string | null {
  const value = headers[key]

  if (typeof value === 'string') {
    return value
  }

  return null
}

async function parseJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    request.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined)
        return
      }

      const rawBody = Buffer.concat(chunks).toString('utf8').trim()

      if (!rawBody) {
        resolve(undefined)
        return
      }

      try {
        resolve(JSON.parse(rawBody) as unknown)
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })

    request.on('error', (error) => {
      reject(error)
    })
  })
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  const body = JSON.stringify(payload)

  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  response.end(body)
}

async function main() {
  const runtimeConfig = resolveDashboardMcpRuntimeConfig()
  const host = process.env.BIZIDASHBOARD_MCP_HTTP_HOST ?? DEFAULT_HTTP_HOST
  const port = parsePort(process.env.BIZIDASHBOARD_MCP_HTTP_PORT)

  const startupBuildResult = await createDashboardMcpServer(runtimeConfig)

  console.error(
    `[bizidashboard-mcp] loaded ${startupBuildResult.manualToolCount} manual tools and ${startupBuildResult.openApiToolCount} OpenAPI tools (${startupBuildResult.skippedOpenApiToolCount} skipped due to name conflicts)`
  )

  if (startupBuildResult.openApiError) {
    console.error(
      `[bizidashboard-mcp] OpenAPI tool generation disabled for this run: ${startupBuildResult.openApiError}`
    )
  }

  try {
    await startupBuildResult.server.close()
  } catch {
    // no-op: startup server instance is used only to warm tool loading and cache
  }

  const sessions = new Map<string, SessionState>()

  async function closeAllSessions() {
    const activeSessions = Array.from(sessions.entries())

    sessions.clear()

    await Promise.all(
      activeSessions.map(async ([, session]) => {
        try {
          await session.transport.close()
        } catch {
          // ignore close errors during shutdown
        }

        try {
          await session.server.close()
        } catch {
          // ignore close errors during shutdown
        }
      })
    )
  }

  const httpServer = createServer(async (request, response) => {
    const requestUrl = new URL(
      request.url ?? '/',
      `http://${request.headers.host ?? 'localhost'}`
    )

    if (requestUrl.pathname === '/health' && request.method === 'GET') {
      writeJson(response, 200, {
        status: 'ok',
        transport: 'http-sse',
        endpoint: '/mcp',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (requestUrl.pathname !== '/mcp') {
      writeJson(response, 404, {
        error: 'Not found'
      })
      return
    }

    const method = request.method ?? 'GET'

    if (!['GET', 'POST', 'DELETE'].includes(method)) {
      response.statusCode = 405
      response.setHeader('Allow', 'GET, POST, DELETE')
      response.end('Method Not Allowed')
      return
    }

    let parsedBody: unknown

    if (method === 'POST') {
      try {
        parsedBody = await parseJsonBody(request)
      } catch (error) {
        writeJson(response, 400, {
          error: error instanceof Error ? error.message : String(error)
        })
        return
      }
    }

    const sessionId = getHeaderValue(request.headers, 'mcp-session-id')
    let session = sessionId ? sessions.get(sessionId) : undefined

    if (!session) {
      if (method !== 'POST' || !isInitializeRequest(parsedBody)) {
        writeJson(response, 400, {
          error:
            'No valid MCP session found. Send an initialize request via POST /mcp first.'
        })
        return
      }

      let sessionServer: McpServer | null = null

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (initializedSessionId) => {
          if (!sessionServer) {
            return
          }

          sessions.set(initializedSessionId, {
            transport,
            server: sessionServer
          })
        }
      })

      const buildResult = await createDashboardMcpServer(runtimeConfig)
      const server = buildResult.server

      sessionServer = server

      transport.onclose = () => {
        const closedSessionId = transport.sessionId

        if (!closedSessionId) {
          return
        }

        sessions.delete(closedSessionId)
      }

      transport.onerror = (error) => {
        console.error('[bizidashboard-mcp] transport error', error)
      }

      await server.connect(transport)

      session = {
        transport,
        server
      }
    }

    try {
      await session.transport.handleRequest(request, response, parsedBody)
    } catch (error) {
      if (!response.headersSent) {
        writeJson(response, 500, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  })

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject)
    httpServer.listen(port, host, () => {
      resolve()
    })
  })

  console.error(
    `[bizidashboard-mcp] running over HTTP/SSE at http://${host}:${port}/mcp using API base URL: ${runtimeConfig.apiBaseUrl}`
  )

  const shutdown = async () => {
    await closeAllSessions()

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  process.on('SIGINT', () => {
    void shutdown().finally(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0))
  })
}

main().catch((error) => {
  console.error('[bizidashboard-mcp] fatal HTTP server error', error)
  process.exit(1)
})
