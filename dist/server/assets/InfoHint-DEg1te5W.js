import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Tooltip } from "@base-ui/react/tooltip";
//#region src/components/ui/tooltip.tsx
init_utils();
Tooltip.Provider;
var Tooltip$1 = Tooltip.Root;
var TooltipTrigger = Tooltip.Trigger;
var TooltipContent = React.forwardRef(function TooltipContent({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Tooltip.Portal, { children: /* @__PURE__ */ jsx(Tooltip.Positioner, {
		sideOffset: 8,
		children: /* @__PURE__ */ jsx(Tooltip.Popup, {
			ref,
			className: (state) => cn("z-50 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-[11px] leading-relaxed text-[var(--foreground)] shadow-[var(--shadow-soft)] backdrop-blur-md", typeof className === "function" ? className(state) : className),
			...props,
			children
		})
	}) });
});
//#endregion
//#region src/app/dashboard/_components/InfoHint.tsx
function InfoHint({ label, content }) {
	return /* @__PURE__ */ jsxs(Tooltip$1, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
		"aria-label": label,
		className: "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]",
		children: "i"
	}), /* @__PURE__ */ jsx(TooltipContent, { children: content })] });
}
//#endregion
export { InfoHint as t };
