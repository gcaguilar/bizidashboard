import { t as getServerFnById } from "./__23tanstack-start-server-fn-resolver-BYi29s5W.js";
import { f as TSS_SERVER_FUNCTION } from "./esm-DmkRHfL6.js";
import { n as cn } from "./page-shell-DP1spWfk.js";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/ui/breadcrumb.tsx
var Breadcrumb = React.forwardRef(function Breadcrumb({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("nav", {
		ref,
		"aria-label": "Breadcrumb",
		className: cn("", className),
		...props
	});
});
var BreadcrumbList = React.forwardRef(function BreadcrumbList({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("ol", {
		ref,
		className: cn("flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]", className),
		...props
	});
});
var BreadcrumbItem = React.forwardRef(function BreadcrumbItem({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("li", {
		ref,
		className: cn("flex items-center gap-2", className),
		...props
	});
});
React.forwardRef(function BreadcrumbLink({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("a", {
		ref,
		className: cn("rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]", className),
		...props
	});
});
var BreadcrumbPage = React.forwardRef(function BreadcrumbPage({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("span", {
		ref,
		"aria-current": "page",
		className: cn("font-semibold text-[var(--foreground)]", className),
		...props
	});
});
var BreadcrumbSeparator = React.forwardRef(function BreadcrumbSeparator({ className, children = "/", ...props }, ref) {
	return /* @__PURE__ */ jsx("span", {
		ref,
		"aria-hidden": "true",
		className: cn("text-[var(--muted)]", className),
		...props,
		children
	});
});
//#endregion
//#region src/app/_components/SiteBreadcrumbs.tsx
function SiteBreadcrumbs({ items, className }) {
	if (items.length === 0) return null;
	return /* @__PURE__ */ jsx("div", {
		className,
		children: /* @__PURE__ */ jsx(Breadcrumb, { children: /* @__PURE__ */ jsx(BreadcrumbList, { children: items.map((item, index) => {
			const isLast = index === items.length - 1;
			return /* @__PURE__ */ jsxs(BreadcrumbItem, { children: [isLast ? /* @__PURE__ */ jsx(BreadcrumbPage, { children: item.label }) : /* @__PURE__ */ jsx(Link, {
				to: item.href,
				className: "rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
				children: item.label
			}), !isLast ? /* @__PURE__ */ jsx(BreadcrumbSeparator, {}) : null] }, `${item.href}-${item.label}`);
		}) }) })
	});
}
//#endregion
//#region node_modules/@tanstack/start-server-core/dist/esm/createSsrRpc.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { SiteBreadcrumbs as n, createSsrRpc as t };

//# sourceMappingURL=createSsrRpc-BFE1gq-C.js.map