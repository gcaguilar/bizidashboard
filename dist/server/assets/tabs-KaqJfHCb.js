import { n as cn } from "./page-shell-DP1spWfk.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
import { Tabs } from "@base-ui/react/tabs";
//#region src/components/ui/checkbox.tsx
var Checkbox = React.forwardRef(function Checkbox({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("input", {
		ref,
		type: "checkbox",
		className: cn("h-4 w-4 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] accent-[var(--primary)]", className),
		...props
	});
});
//#endregion
//#region src/components/ui/tabs.tsx
var Tabs$1 = Tabs.Root;
var TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Tabs.List, {
		ref,
		className: (state) => cn("flex gap-1 border-b border-[var(--border)]", typeof className === "function" ? className(state) : className),
		...props
	});
});
var TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Tabs.Tab, {
		ref,
		className: (state) => cn("rounded-t-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors outline-none", state.active ? "border-b-0 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]", typeof className === "function" ? className(state) : className),
		...props
	});
});
var TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Tabs.Panel, {
		ref,
		className: (state) => cn("space-y-6 outline-none", typeof className === "function" ? className(state) : className),
		...props
	});
});
//#endregion
export { Checkbox as a, TabsTrigger as i, TabsContent as n, TabsList as r, Tabs$1 as t };

//# sourceMappingURL=tabs-KaqJfHCb.js.map