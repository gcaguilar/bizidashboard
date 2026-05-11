import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/ui/metric-card.tsx
init_utils();
var MetricCard = React.forwardRef(function MetricCard({ className, label, value, detail, ...props }, ref) {
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: cn("ui-metric-card rounded-xl px-4 py-4", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "stat-label",
				children: label
			}),
			/* @__PURE__ */ jsx("p", {
				className: "stat-value",
				children: value
			}),
			detail ? /* @__PURE__ */ jsx("p", {
				className: "text-[11px] text-[var(--muted)]",
				children: detail
			}) : null
		]
	});
});
var MetricGrid = React.forwardRef(function MetricGrid({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className),
		...props
	});
});
//#endregion
export { MetricGrid as n, MetricCard as t };
