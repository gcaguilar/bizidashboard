# Shared developer identity and MCP access

## Purpose

BiziDashboard is the authorization authority for developer accounts and API
keys. Auth0 authenticates people. `bizidashboard-mcp` is a public resource
server and forwards the authenticated user's access token to BiziDashboard;
it never owns or creates the user's API key.

## Canonical identity

`sub` from a verified Auth0 access or ID token is the immutable external
identity. Email is presentation data only and may change. Every successful
web login or bearer-token request resolves a single local `Account`.

```
Auth0 sub -> Account -> ApiKey
                   -> AccountCityAccess
```

Account authorization state is local to BiziDashboard. A locally revoked
account is denied even if Auth0 still has a valid session or access token.

## Credentials

| Caller | Credential | Intended use |
| --- | --- | --- |
| Dashboard browser | sealed BiziDashboard session cookie | account and key management |
| Script / server integration | `x-api-key` | direct API access |
| Claude connector / ChatGPT Action | Auth0 OAuth access token | public remote MCP and Actions |
| MCP upstream request | original validated OAuth access token | per-account API authorization |

MCP remote requests must not use a server-wide API key to obtain elevated
access. API keys remain available for direct integrations and optional local
stdio compatibility only.

## Token requirements

BiziDashboard and the MCP validate access tokens with Auth0 JWKS. A token is
accepted only when all of these checks succeed:

- expected issuer;
- exact configured API audience;
- valid signature and expiry;
- non-empty `sub`;
- allowed client (`azp` or `client_id`) when configured;
- route-specific OAuth scope.

The mobile application's JWTs are a separate authentication system and are
never handled by this verifier.

## Scopes and route policy

| Scope | Grants |
| --- | --- |
| `read:dashboard` | authenticated MCP/Action JSON operations |
| `read:exports` | CSV, long windows, and expensive analytics operations |
| `manage:keys` | browser portal key creation, listing, and revocation |

Public JSON endpoints remain anonymous for direct BiziDashboard visitors.
OAuth is required on the MCP public endpoints. Elevated BiziDashboard routes
accept a valid API key, a qualifying browser session, or a bearer principal
with the applicable scope and city access.

## Storage boundary

Account, access grants, and API-key ownership must be stored globally rather
than in an individual city schema. The implementation must make this explicit
through a shared PostgreSQL schema or a dedicated authorization datasource.
Deployments must not silently create a separate account for each city.

## Audit and rate limits

Never log a bearer token or full API key. Authenticated audit events use
`accountId`, `auth0Subject`, OAuth client id, route/tool, outcome, request id,
and latency. Rate limits are keyed by API key id, account id, and IP as
separate protections.
