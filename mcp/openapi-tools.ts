import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

const API_PREFIX = '/api'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type OpenApiSchema = {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  format?: string
  enum?: unknown[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  items?: OpenApiSchema
  properties?: Record<string, OpenApiSchema>
  required?: string[]
  additionalProperties?: boolean | OpenApiSchema
}

type OpenApiParameter = {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: OpenApiSchema
}

type OpenApiRequestBody = {
  required?: boolean
  content?: {
    'application/json'?: {
      schema?: OpenApiSchema
    }
  }
}

type OpenApiOperation = {
  operationId?: string
  summary?: string
  description?: string
  parameters?: OpenApiParameter[]
  requestBody?: OpenApiRequestBody
}

type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>

type OpenApiDocument = {
  openapi: string
  paths?: Record<string, OpenApiPathItem>
}

type PreparedOperation = {
  toolName: string
  description: string
  method: HttpMethod
  path: string
  queryParams: string[]
  pathParams: string[]
  hasJsonBody: boolean
  inputSchema: Record<string, z.ZodTypeAny>
}

export type OpenApiToolRegistrationOptions = {
  openApiUrl: string
  apiBaseUrl: string
  apiTimeoutMs: number
  reservedToolNames?: Set<string>
}

export type OpenApiToolRegistrationSummary = {
  loaded: number
  skipped: number
  toolNames: string[]
}

const operationCache = new Map<string, Promise<PreparedOperation[]>>()

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete']

function normalizeToolName(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function shouldExposePath(path: string): boolean {
  if (!path.startsWith(API_PREFIX)) {
    return false
  }

  if (path.startsWith('/health') || path.startsWith('/internal')) {
    return false
  }

  if (path.startsWith('/api/internal') || path.startsWith('/api/health')) {
    return false
  }

  return true
}

function deriveToolName(method: HttpMethod, path: string, operationId?: string): string {
  if (operationId && operationId.trim()) {
    return normalizeToolName(operationId)
  }

  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith('{') && segment.endsWith('}')) {
        return `by_${normalizeToolName(segment.slice(1, -1))}`
      }

      return normalizeToolName(segment)
    })
    .filter(Boolean)

  if (segments[0] === 'api') {
    segments.shift()
  }

  const suffix = segments.length > 0 ? segments.join('_') : 'root'

  return normalizeToolName(`${method}_${suffix}`)
}

function toZodSchema(schema: OpenApiSchema | undefined): z.ZodTypeAny {
  if (!schema) {
    return z.any()
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null

  if (schema.type === 'string') {
    let nextSchema = z.string()

    if (typeof schema.minLength === 'number') {
      nextSchema = nextSchema.min(schema.minLength)
    }

    if (typeof schema.maxLength === 'number') {
      nextSchema = nextSchema.max(schema.maxLength)
    }

    if (enumValues) {
      nextSchema = nextSchema.refine((value) => enumValues.includes(value), {
        message: `Expected one of: ${enumValues.join(', ')}`
      })
    }

    return nextSchema
  }

  if (schema.type === 'integer') {
    let nextSchema = z.number().int()

    if (typeof schema.minimum === 'number') {
      nextSchema = nextSchema.min(schema.minimum)
    }

    if (typeof schema.maximum === 'number') {
      nextSchema = nextSchema.max(schema.maximum)
    }

    if (enumValues) {
      nextSchema = nextSchema.refine((value) => enumValues.includes(value), {
        message: `Expected one of: ${enumValues.join(', ')}`
      })
    }

    return nextSchema
  }

  if (schema.type === 'number') {
    let nextSchema = z.number()

    if (typeof schema.minimum === 'number') {
      nextSchema = nextSchema.min(schema.minimum)
    }

    if (typeof schema.maximum === 'number') {
      nextSchema = nextSchema.max(schema.maximum)
    }

    if (enumValues) {
      nextSchema = nextSchema.refine((value) => enumValues.includes(value), {
        message: `Expected one of: ${enumValues.join(', ')}`
      })
    }

    return nextSchema
  }

  if (schema.type === 'boolean') {
    return z.boolean()
  }

  if (schema.type === 'array') {
    return z.array(toZodSchema(schema.items))
  }

  if (schema.type === 'object') {
    if (schema.properties) {
      const shape: Record<string, z.ZodTypeAny> = {}
      const requiredFields = new Set(schema.required ?? [])

      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        const propertyZod = toZodSchema(propertySchema)
        shape[key] = requiredFields.has(key) ? propertyZod : propertyZod.optional()
      }

      return z.object(shape)
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      return z.record(z.string(), toZodSchema(schema.additionalProperties))
    }

    return z.record(z.string(), z.any())
  }

  return z.any()
}

function withDescription(schema: z.ZodTypeAny, description?: string): z.ZodTypeAny {
  if (!description) {
    return schema
  }

  return schema.describe(description)
}

function ensureTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function parseOpenApiDocument(payload: unknown): OpenApiDocument {
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenAPI document is not a valid object.')
  }

  const document = payload as OpenApiDocument

  if (typeof document.openapi !== 'string') {
    throw new Error('OpenAPI document does not include the "openapi" field.')
  }

  if (!document.paths || typeof document.paths !== 'object') {
    throw new Error('OpenAPI document does not include valid "paths".')
  }

  return document
}

function replacePathParams(
  template: string,
  pathParams: string[],
  args: Record<string, unknown>
): string {
  let resolvedPath = template

  for (const paramName of pathParams) {
    const value = args[paramName]

    if (value === undefined || value === null) {
      throw new Error(`Missing required path parameter: ${paramName}`)
    }

    resolvedPath = resolvedPath.replace(`{${paramName}}`, encodeURIComponent(String(value)))
  }

  return resolvedPath
}

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: unknown
): void {
  if (value === undefined || value === null) {
    return
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      searchParams.append(key, String(entry))
    }

    return
  }

  searchParams.set(key, String(value))
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ status: number; body: unknown }> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: abortController.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {})
      }
    })

    const rawBody = await response.text()

    let body: unknown = null

    if (rawBody) {
      try {
        body = JSON.parse(rawBody) as unknown
      } catch {
        body = {
          raw: rawBody
        }
      }
    }

    return {
      status: response.status,
      body
    }
  } finally {
    clearTimeout(timeout)
  }
}

function toToolResponse(payload: unknown) {
  const structuredContent =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : { result: payload }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent
  }
}

function toToolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }]
  }
}

function buildOperationInputSchema(
  operation: OpenApiOperation,
  queryParams: string[],
  pathParams: string[]
): Record<string, z.ZodTypeAny> {
  const schema: Record<string, z.ZodTypeAny> = {}

  for (const parameter of operation.parameters ?? []) {
    if (parameter.in !== 'query' && parameter.in !== 'path') {
      continue
    }

    const parameterSchema = withDescription(
      toZodSchema(parameter.schema),
      parameter.description
    )
    const isRequired = parameter.in === 'path' ? true : Boolean(parameter.required)

    schema[parameter.name] = isRequired
      ? parameterSchema
      : parameterSchema.optional()

    if (parameter.in === 'query') {
      queryParams.push(parameter.name)
    }

    if (parameter.in === 'path') {
      pathParams.push(parameter.name)
    }
  }

  const requestBodySchema = operation.requestBody?.content?.['application/json']?.schema

  if (requestBodySchema) {
    const bodySchema = toZodSchema(requestBodySchema)

    schema.body = operation.requestBody?.required ? bodySchema : bodySchema.optional()
  }

  schema.apiBaseUrl = z
    .string()
    .url()
    .optional()
    .describe('Optional override for the API base URL.')

  return schema
}

function prepareOperations(document: OpenApiDocument): PreparedOperation[] {
  const operations: PreparedOperation[] = []

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!shouldExposePath(path)) {
      continue
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]

      if (!operation) {
        continue
      }

      const queryParams: string[] = []
      const pathParams: string[] = []
      const inputSchema = buildOperationInputSchema(operation, queryParams, pathParams)
      const toolName = deriveToolName(method, path, operation.operationId)

      operations.push({
        toolName,
        description:
          operation.summary ??
          operation.description ??
          `${method.toUpperCase()} ${path}`,
        method,
        path,
        queryParams,
        pathParams,
        hasJsonBody: Boolean(operation.requestBody?.content?.['application/json']),
        inputSchema
      })
    }
  }

  return operations
}

async function loadPreparedOperations(
  openApiUrl: string,
  timeoutMs: number
): Promise<PreparedOperation[]> {
  const response = await fetchJsonWithTimeout(
    openApiUrl,
    {
      method: 'GET'
    },
    timeoutMs
  )

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Failed to load OpenAPI spec from ${openApiUrl}. Status: ${response.status}`
    )
  }

  const document = parseOpenApiDocument(response.body)

  return prepareOperations(document)
}

function getCachedPreparedOperations(
  openApiUrl: string,
  timeoutMs: number
): Promise<PreparedOperation[]> {
  const cached = operationCache.get(openApiUrl)

  if (cached) {
    return cached
  }

  const pending = loadPreparedOperations(openApiUrl, timeoutMs)

  operationCache.set(openApiUrl, pending)

  return pending
}

export async function registerOpenApiTools(
  server: McpServer,
  options: OpenApiToolRegistrationOptions
): Promise<OpenApiToolRegistrationSummary> {
  const preparedOperations = await getCachedPreparedOperations(
    options.openApiUrl,
    options.apiTimeoutMs
  )

  const reservedToolNames = options.reservedToolNames ?? new Set<string>()

  let loaded = 0
  let skipped = 0
  const toolNames: string[] = []

  for (const operation of preparedOperations) {
    if (reservedToolNames.has(operation.toolName)) {
      skipped += 1
      continue
    }

    reservedToolNames.add(operation.toolName)

    server.registerTool(
      operation.toolName,
      {
        description: operation.description,
        inputSchema: operation.inputSchema
      },
      async (input) => {
        try {
          const args = (input ?? {}) as Record<string, unknown>
          const baseUrl =
            typeof args.apiBaseUrl === 'string' && args.apiBaseUrl
              ? args.apiBaseUrl
              : options.apiBaseUrl

          const resolvedPath = replacePathParams(operation.path, operation.pathParams, args)
          const targetUrl = new URL(resolvedPath, ensureTrailingSlash(baseUrl))

          for (const queryParam of operation.queryParams) {
            appendQueryValue(targetUrl.searchParams, queryParam, args[queryParam])
          }

          let serializedBody: string | undefined

          if (operation.hasJsonBody && args.body !== undefined) {
            serializedBody = JSON.stringify(args.body)
          }

          const response = await fetchJsonWithTimeout(
            targetUrl.toString(),
            {
              method: operation.method.toUpperCase(),
              headers: serializedBody
                ? {
                    'Content-Type': 'application/json'
                  }
                : undefined,
              body: serializedBody
            },
            options.apiTimeoutMs
          )

          if (response.status < 200 || response.status >= 300) {
            throw new Error(
              `${operation.method.toUpperCase()} ${operation.path} failed with ${response.status}.`
            )
          }

          return toToolResponse(response.body)
        } catch (error) {
          return toToolError(error)
        }
      }
    )

    loaded += 1
    toolNames.push(operation.toolName)
  }

  return {
    loaded,
    skipped,
    toolNames
  }
}
