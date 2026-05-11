import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
//#region src/lib/request-context.ts
function createFallbackStore() {
	let current;
	return {
		getStore: () => current,
		run: (context, callback) => {
			const previous = current;
			current = context;
			try {
				return callback();
			} finally {
				current = previous;
			}
		},
		enterWith: (context) => {
			current = context;
		}
	};
}
function createContextStore() {
	if (typeof window !== "undefined") return createFallbackStore();
	try {
		const { AsyncLocalStorage } = (0, eval)("require")("node:async_hooks");
		return new AsyncLocalStorage();
	} catch {
		return createFallbackStore();
	}
}
function createRequestId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
	return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function getExecutionContext() {
	return contextStore.getStore();
}
function resolveRequestId(headers) {
	const incomingId = headers?.get("x-request-id")?.trim();
	return incomingId && incomingId.length > 0 ? incomingId : createRequestId();
}
function runWithExecutionContext(context, callback) {
	return contextStore.run(context, callback);
}
function updateExecutionContext(patch) {
	const current = contextStore.getStore();
	if (!current) return;
	const next = {
		...current,
		...patch
	};
	contextStore.enterWith(next);
	return next;
}
var contextStore;
var init_request_context = __esmMin((() => {
	contextStore = createContextStore();
}));
//#endregion
export { updateExecutionContext as a, runWithExecutionContext as i, init_request_context as n, resolveRequestId as r, getExecutionContext as t };
