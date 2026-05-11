import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/input.tsx
var Input;
var init_input = __esmMin((() => {
	init_utils();
	Input = React.forwardRef(function Input({ className, type = "text", ...props }, ref) {
		return /* @__PURE__ */ jsx("input", {
			ref,
			type,
			className: cn("min-h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]/45", className),
			...props
		});
	});
}));
//#endregion
export { init_input as n, Input as t };
