# MCP Dashboard Server

This project ships an MCP server that wraps the internal REST API and can generate dashboard payloads from natural language.

## Start

```bash
pnpm mcp:dashboard
```

The server uses stdio transport and is intended to be launched by an MCP-compatible client.

## Environment Variables

```env
# API base URL where this app is running
BIZIDASHBOARD_API_BASE_URL=http://localhost:3000

# Request timeout for MCP -> API calls
BIZIDASHBOARD_API_TIMEOUT_MS=20000
```

## Tools

- `build_dashboard_spec`
  - Creates a JSON dashboard specification from a natural-language request.
- `generate_dashboard`
  - Builds the specification and resolves live data for each widget.
  - Accepts optional `customWidgets` to build ad-hoc panels from existing endpoints.
- `get_status`
  - Fetches pipeline health and quality metrics.
- `get_stations`
  - Fetches current station snapshots.
- `get_rankings`
  - Fetches rankings by `turnover` or `availability`.
- `get_alerts`
  - Fetches active alerts.
- `get_patterns`
  - Fetches weekday/weekend hourly patterns for one station.
- `get_heatmap`
  - Fetches station occupancy heatmap cells.
- `get_mobility`
  - Fetches hourly mobility signals and demand curve.

## Example Prompt

"Quiero un dashboard con top 10 estaciones por rotacion, alertas, y heatmap para station 123"

Use this prompt with `generate_dashboard`.

## Ad-hoc Custom Widget

You can ask the model to call `generate_dashboard` with `customWidgets`.

Example custom widget payload:

```json
[
  {
    "id": "rows_total",
    "title": "Filas totales del pipeline",
    "sourceEndpoint": "status",
    "mode": "kpi",
    "valuePath": "pipeline.totalRowsCollected"
  },
  {
    "id": "ocupacion_horaria",
    "title": "Ocupacion media por hora",
    "sourceEndpoint": "patterns",
    "sourceParams": { "stationId": "130" },
    "mode": "timeseries",
    "xKey": "hour",
    "yKey": "occupancyAvg"
  }
]
```
