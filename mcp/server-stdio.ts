import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  createDashboardMcpServer,
  resolveDashboardMcpRuntimeConfig
} from './tools'

export async function runStdioServer(): Promise<void> {
  const runtimeConfig = resolveDashboardMcpRuntimeConfig()
  const buildResult = await createDashboardMcpServer(runtimeConfig)
  const transport = new StdioServerTransport()

  await buildResult.server.connect(transport)

  console.error(
    `[bizidashboard-mcp] loaded ${buildResult.manualToolCount} manual tools and ${buildResult.openApiToolCount} OpenAPI tools (${buildResult.skippedOpenApiToolCount} skipped due to name conflicts)`
  )

  if (buildResult.openApiError) {
    console.error(
      `[bizidashboard-mcp] OpenAPI tool generation disabled for this run: ${buildResult.openApiError}`
    )
  }

  console.error(
    `[bizidashboard-mcp] running on stdio with API base URL: ${runtimeConfig.apiBaseUrl}`
  )
}

runStdioServer().catch((error) => {
  console.error('[bizidashboard-mcp] fatal stdio error', error)
  process.exit(1)
})
