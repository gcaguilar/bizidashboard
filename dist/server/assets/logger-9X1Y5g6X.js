import { t as getExecutionContext } from "./request-context-Dvwx1ba4.js";
//#region src/lib/logger.ts
function normalizeValue(value) {
	if (value instanceof Error) return {
		name: value.name,
		message: value.message,
		stack: value.stack
	};
	if (Array.isArray(value)) return value.map((entry) => normalizeValue(entry));
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== void 0).map(([key, entry]) => [key, normalizeValue(entry)]));
	return value;
}
function toLogRecord(value) {
	const normalized = normalizeValue(value);
	if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) return normalized;
	return {};
}
function emit(level, message, extra) {
	const entry = {
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		level,
		message,
		...toLogRecord(getExecutionContext()),
		...toLogRecord(extra)
	};
	const payload = JSON.stringify(entry);
	switch (level) {
		case "debug":
			console.debug(payload);
			return;
		case "warn":
			console.warn(payload);
			return;
		case "error":
			console.error(payload);
			return;
		default: console.log(payload);
	}
}
var logger = {
	debug(message, extra) {},
	info(message, extra) {
		emit("info", message, extra);
	},
	warn(message, extra) {
		emit("warn", message, extra);
	},
	error(message, extra) {
		emit("error", message, extra);
	}
};
//#endregion
export { logger as t };

//# sourceMappingURL=logger-9X1Y5g6X.js.map