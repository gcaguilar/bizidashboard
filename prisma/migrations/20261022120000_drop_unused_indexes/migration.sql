-- Indices que ninguna consulta usa: solo cuestan escrituras en cada INSERT.
-- StationRanking(stationId) es prefijo de unique(stationId, windowStart, windowEnd),
-- que ya sirve al FK. Las consultas de SecurityEvent filtran por createdAt y
-- eventType; nada filtra CollectionRun por city ni agrupa episodios por
-- (monthKey, kind, durationMinutes). El refresco de tokens busca la instalacion
-- por installId, no por previousRefreshTokenHash (indice que ademas no estaba
-- declarado en schema.prisma).
DROP INDEX IF EXISTS "StationRanking_stationId_idx";
DROP INDEX IF EXISTS "SecurityEvent_route_createdAt_idx";
DROP INDEX IF EXISTS "SecurityEvent_installId_createdAt_idx";
DROP INDEX IF EXISTS "SecurityEvent_outcome_createdAt_idx";
DROP INDEX IF EXISTS "CollectionRun_city_startedAt_idx";
DROP INDEX IF EXISTS "StationCriticalEpisode_monthKey_kind_durationMinutes_idx";
DROP INDEX IF EXISTS "Install_previousRefreshTokenHash_idx";
