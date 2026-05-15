import { n as cn } from "./page-shell-DP1spWfk.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Accordion } from "@base-ui/react/accordion";
//#region src/components/ui/accordion.tsx
var Accordion$1 = Accordion.Root;
var AccordionItem = React.forwardRef(function AccordionItem({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Accordion.Item, {
		ref,
		className: (state) => cn("overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]", typeof className === "function" ? className(state) : className),
		...props
	});
});
var AccordionTrigger = React.forwardRef(function AccordionTrigger({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Accordion.Header, {
		className: "flex",
		children: /* @__PURE__ */ jsxs(Accordion.Trigger, {
			ref,
			className: (state) => cn("flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none", state.open ? "text-[var(--foreground)]" : "text-[var(--foreground)]", typeof className === "function" ? className(state) : className),
			...props,
			children: [/* @__PURE__ */ jsx("span", {
				className: "text-base font-semibold",
				children
			}), /* @__PURE__ */ jsx("span", {
				className: "text-lg font-bold text-[var(--muted)]",
				"aria-hidden": "true",
				children: "+"
			})]
		})
	});
});
var AccordionContent = React.forwardRef(function AccordionContent({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Accordion.Panel, {
		ref,
		className: (state) => cn("border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]", typeof className === "function" ? className(state) : className),
		...props
	});
});
//#endregion
export { AccordionTrigger as i, AccordionContent as n, AccordionItem as r, Accordion$1 as t };

//# sourceMappingURL=accordion-Cl6-ndDy.js.map