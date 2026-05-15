import { n as cn } from "./page-shell-DP1spWfk.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Select } from "@base-ui/react/select";
//#region src/components/ui/select.tsx
var Select$1 = Select.Root;
var SelectTrigger = React.forwardRef(function SelectTrigger({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Select.Trigger, {
		ref,
		className: (state) => cn("inline-flex min-h-8 items-center justify-between gap-2 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition", state.open && "border-[var(--primary)]", typeof className === "function" ? className(state) : className),
		...props,
		children
	});
});
var SelectValue = React.forwardRef(function SelectValue({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx(Select.Value, {
		ref,
		className: (state) => cn("truncate text-left", typeof className === "function" ? className(state) : className),
		...props
	});
});
function SelectIcon() {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "text-xs text-[var(--muted)]",
		children: "▾"
	});
}
var SelectContent = React.forwardRef(function SelectContent({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsx(Select.Portal, { children: /* @__PURE__ */ jsx(Select.Positioner, {
		sideOffset: 6,
		children: /* @__PURE__ */ jsx(Select.Popup, {
			ref,
			className: (state) => cn("z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--shadow-md)] outline-none backdrop-blur-md", typeof className === "function" ? className(state) : className),
			...props,
			children: /* @__PURE__ */ jsx(Select.List, {
				className: "max-h-72 overflow-auto",
				children
			})
		})
	}) });
});
var SelectItem = React.forwardRef(function SelectItem({ className, children, ...props }, ref) {
	return /* @__PURE__ */ jsxs(Select.Item, {
		ref,
		className: (state) => cn("flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none", state.highlighted && "bg-[var(--primary)]/10 text-[var(--primary)]", state.selected && "font-semibold", typeof className === "function" ? className(state) : className),
		...props,
		children: [/* @__PURE__ */ jsx(Select.ItemText, { children }), /* @__PURE__ */ jsx(Select.ItemIndicator, {
			className: "ml-3 text-xs text-[var(--primary)]",
			children: "✓"
		})]
	});
});
//#endregion
//#region src/components/ui/table.tsx
var Table = React.forwardRef(function Table({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("table", {
		ref,
		className: cn("w-full caption-bottom text-sm text-[var(--foreground)]", className),
		...props
	});
});
var TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("thead", {
		ref,
		className: cn("[&_tr]:border-b", className),
		...props
	});
});
var TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("tbody", {
		ref,
		className: cn("[&_tr:last-child]:border-0", className),
		...props
	});
});
var TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("tr", {
		ref,
		className: cn("border-b border-[var(--border)] transition-colors", className),
		...props
	});
});
var TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("th", {
		ref,
		className: cn("h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-[0.09em] text-[var(--muted)]", className),
		...props
	});
});
var TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("td", {
		ref,
		className: cn("px-3 py-2 align-middle", className),
		...props
	});
});
React.forwardRef(function TableCaption({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("caption", {
		ref,
		className: cn("mt-3 text-xs text-[var(--muted)]", className),
		...props
	});
});
//#endregion
export { TableHeader as a, SelectContent as c, SelectTrigger as d, SelectValue as f, TableHead as i, SelectIcon as l, TableBody as n, TableRow as o, TableCell as r, Select$1 as s, Table as t, SelectItem as u };

//# sourceMappingURL=table-Fvifybs5.js.map