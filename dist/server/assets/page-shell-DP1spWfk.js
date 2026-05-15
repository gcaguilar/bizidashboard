import { jsx } from "react/jsx-runtime";
//#region src/lib/utils.ts
function cn(...values) {
	return values.filter(Boolean).join(" ");
}
//#endregion
//#region src/components/layout/page-shell.tsx
function PageShell({ as = "main", className, children, maxWidthClassName = "max-w-[1280px]", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		className: cn("mx-auto flex min-h-screen w-full flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8", maxWidthClassName, className),
		...props,
		children
	});
}
//#endregion
export { cn as n, PageShell as t };

//# sourceMappingURL=page-shell-DP1spWfk.js.map