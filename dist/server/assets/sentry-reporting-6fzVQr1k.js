import { t as getExecutionContext } from "./request-context-Dvwx1ba4.js";
import * as Sentry from "@sentry/tanstackstart-react";
//#region src/lib/sentry-reporting.ts
var capturedMessageKeys = /* @__PURE__ */ new Set();
function toError(error) {
	if (error instanceof Error) return error;
	if (typeof error === "string") return new Error(error);
	try {
		return new Error(JSON.stringify(error));
	} catch {
		return /* @__PURE__ */ new Error("Unknown non-Error exception");
	}
}
function applyContext(scope, context) {
	const executionContext = getExecutionContext();
	scope.setTag("area", context.area);
	if (context.operation) scope.setTag("operation", context.operation);
	if (executionContext?.requestId) scope.setTag("request_id", executionContext.requestId);
	if (executionContext?.routeGroup) scope.setTag("route_group", executionContext.routeGroup);
	if (executionContext?.city) scope.setTag("city", executionContext.city);
	if (executionContext?.installId) scope.setTag("install_id", executionContext.installId);
	if (executionContext?.collectionId) scope.setTag("collection_id", executionContext.collectionId);
	if (executionContext?.trigger) scope.setTag("trigger", executionContext.trigger);
	if (executionContext?.sourceUrl) scope.setTag("source_url", executionContext.sourceUrl);
	if (executionContext?.gbfsVersion) scope.setTag("gbfs_version", executionContext.gbfsVersion);
	if (typeof executionContext?.rateLimited === "boolean") scope.setTag("rate_limited", String(executionContext.rateLimited));
	if (executionContext?.cacheBackend) scope.setTag("cache_backend", executionContext.cacheBackend);
	for (const [key, value] of Object.entries(context.tags ?? {})) if (value !== null && value !== void 0) scope.setTag(key, String(value));
	const details = {
		...executionContext ? {
			requestId: executionContext.requestId,
			route: executionContext.route,
			routeGroup: executionContext.routeGroup,
			city: executionContext.city,
			installId: executionContext.installId,
			collectionId: executionContext.collectionId,
			trigger: executionContext.trigger,
			ipHash: executionContext.ipHash,
			userAgentHash: executionContext.userAgentHash
		} : {},
		...context.extra ?? {}
	};
	if (Object.keys(details).length > 0) scope.setContext("details", details);
}
function shouldSkipMessageCapture(dedupeKey) {
	if (!dedupeKey) return false;
	if (capturedMessageKeys.has(dedupeKey)) return true;
	capturedMessageKeys.add(dedupeKey);
	return false;
}
function captureExceptionWithContext(error, context) {
	const exception = toError(error);
	return Sentry.withScope((scope) => {
		applyContext(scope, context);
		return Sentry.captureException(exception);
	});
}
function captureWarningWithContext(message, context) {
	if (shouldSkipMessageCapture(context.dedupeKey)) return;
	Sentry.withScope((scope) => {
		applyContext(scope, context);
		scope.setLevel("warning");
		Sentry.captureMessage(message, "warning");
	});
}
//#endregion
export { captureWarningWithContext as n, captureExceptionWithContext as t };

//# sourceMappingURL=sentry-reporting-6fzVQr1k.js.map