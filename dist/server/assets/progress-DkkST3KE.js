import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/progress.tsx
init_utils();
function toProgress(value) {
	if (typeof value !== "number" || Number.isNaN(value)) return 0;
	return Math.max(0, Math.min(100, value));
}
var Progress = React.forwardRef(function Progress({ className, value = 0, indicatorClassName, ...props }, ref) {
	const clamped = toProgress(value);
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "progressbar",
		"aria-valuenow": Math.round(clamped),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-black/20", className),
		...props,
		children: /* @__PURE__ */ jsx("div", {
			className: cn("h-full rounded-full bg-[var(--primary)] transition-[width]", indicatorClassName),
			style: { width: `${clamped}%` }
		})
	});
});
//#endregion
export { Progress as t };
