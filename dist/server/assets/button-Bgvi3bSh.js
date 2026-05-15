import { n as cn } from "./page-shell-DP1spWfk.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/slot.tsx
var Slot = React.forwardRef(function Slot({ children, className, ...props }, _forwardedRef) {
	const child = React.Children.only(children);
	const childProps = child.props;
	return React.cloneElement(child, {
		...props,
		...childProps,
		className: cn(className, childProps.className)
	});
});
//#endregion
//#region src/components/ui/button.tsx
var BUTTON_VARIANT_CLASSES = {
	default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-strong)]",
	outline: "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--card)]",
	ghost: "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]",
	chip: "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]",
	"icon-button": "min-h-10 min-w-10 rounded-[0.65rem] border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-[0.78rem] font-bold text-[var(--primary-strong)] transition hover:-translate-y-px hover:border-[var(--primary-soft)] hover:bg-[color-mix(in_srgb,var(--primary)_16%,var(--secondary))] hover:text-white active:translate-y-0",
	cta: "border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
};
var BUTTON_SIZE_CLASSES = {
	default: "min-h-10 px-4 py-2 text-sm",
	sm: "min-h-8 px-3 py-1.5 text-xs",
	icon: "h-10 w-10 p-0 text-sm"
};
function buttonVariants({ variant = "default", size = "default", className } = {}) {
	const baseClasses = variant === "icon-button" ? "inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-60" : "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition outline-none disabled:pointer-events-none disabled:opacity-60";
	const sizeClasses = variant === "icon-button" && size === "default" ? "" : BUTTON_SIZE_CLASSES[size];
	return cn(baseClasses, BUTTON_VARIANT_CLASSES[variant], sizeClasses, className);
}
var Button = React.forwardRef(function Button({ className, variant = "default", size = "default", type = "button", asChild = false, children, ...props }, ref) {
	const classes = buttonVariants({
		variant,
		size,
		className
	});
	if (asChild) return /* @__PURE__ */ jsx(Slot, {
		ref,
		"data-button-variant": variant,
		className: classes,
		...props,
		children
	});
	return /* @__PURE__ */ jsx("button", {
		ref,
		type,
		"data-button-variant": variant,
		className: classes,
		...props,
		children
	});
});
React.forwardRef(function IconButton({ className, size = "default", ...props }, ref) {
	return /* @__PURE__ */ jsx(Button, {
		ref,
		variant: "icon-button",
		size,
		className,
		...props
	});
});
//#endregion
export { buttonVariants as n, Button as t };

//# sourceMappingURL=button-Bgvi3bSh.js.map