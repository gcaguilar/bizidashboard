import { n as cn } from "./page-shell-DP1spWfk.js";
import { c as buildNavigationClickEvent, f as resolveRouteKeyFromPathname, i as buildEntitySelectEvent, p as trackUmamiEvent, r as buildDashboardPageViewEvent, s as buildLegacyInteractionEvent, t as buildCtaClickEvent } from "./umami-BYNhNb0r.js";
import * as React from "react";
import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/input.tsx
var Input = React.forwardRef(function Input({ className, type = "text", ...props }, ref) {
	return /* @__PURE__ */ jsx("input", {
		ref,
		type,
		className: cn("min-h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]/45", className),
		...props
	});
});
//#endregion
//#region src/app/dashboard/_components/DashboardPageViewTracker.tsx
function DashboardPageViewTracker({ routeKey, pageType, template, mode }) {
	const pathname = useLocation().pathname;
	const lastTrackedKey = useRef(null);
	useEffect(() => {
		if (!pathname) return;
		const resolvedRouteKey = routeKey ?? resolveRouteKeyFromPathname(pathname);
		const trackingKey = [
			pathname,
			resolvedRouteKey,
			pageType,
			template,
			mode ?? ""
		].join("|");
		if (lastTrackedKey.current === trackingKey) return;
		lastTrackedKey.current = trackingKey;
		trackUmamiEvent(buildDashboardPageViewEvent({
			routeKey: resolvedRouteKey,
			pageType,
			template,
			mode
		}));
	}, [
		mode,
		pageType,
		pathname,
		routeKey,
		template
	]);
	return null;
}
//#endregion
//#region src/components/ui/scroll-area.tsx
var ScrollArea = React.forwardRef(function ScrollArea({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: cn("overflow-auto", className),
		...props
	});
});
//#endregion
//#region src/app/_components/TrackedAnchor.tsx
function TrackedAnchor({ children, ctaEvent, entitySelectEvent, eventName, eventData, navigationEvent, trackingEvent, onClick, className, ...anchorProps }) {
	const pathname = useLocation().pathname;
	function handleClick(event) {
		const surface = pathname?.startsWith("/dashboard") ? "dashboard" : "public";
		const routeKey = resolveRouteKeyFromPathname(pathname);
		if (trackingEvent) trackUmamiEvent(trackingEvent);
		else if (navigationEvent) trackUmamiEvent(buildNavigationClickEvent({
			surface,
			routeKey,
			...navigationEvent
		}));
		else if (ctaEvent) trackUmamiEvent(buildCtaClickEvent({
			surface,
			routeKey,
			...ctaEvent
		}));
		else if (entitySelectEvent) trackUmamiEvent(buildEntitySelectEvent({
			surface,
			routeKey,
			...entitySelectEvent
		}));
		else if (eventName) trackUmamiEvent(buildLegacyInteractionEvent({
			eventName,
			eventData,
			pathname
		}));
		onClick?.(event);
	}
	return /* @__PURE__ */ jsx("a", {
		...anchorProps,
		onClick: handleClick,
		className: `${className ?? ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim(),
		children
	});
}
//#endregion
//#region src/components/ui/alert.tsx
var ALERT_VARIANT_CLASSES = {
	default: "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]",
	success: "border-[var(--success)]/40 bg-[var(--success)]/12 text-[var(--foreground)]",
	warning: "border-[var(--warning)]/40 bg-[var(--warning)]/12 text-[var(--foreground)]",
	danger: "border-[var(--danger)]/40 bg-[var(--danger)]/12 text-[var(--foreground)]"
};
var Alert = React.forwardRef(function Alert({ className, variant = "default", ...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "alert",
		className: cn("w-full rounded-xl border px-3 py-2 text-sm", ALERT_VARIANT_CLASSES[variant], className),
		...props
	});
});
var AlertTitle = React.forwardRef(function AlertTitle({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("p", {
		ref,
		className: cn("font-semibold text-[var(--foreground)]", className),
		...props
	});
});
var AlertDescription = React.forwardRef(function AlertDescription({ className, ...props }, ref) {
	return /* @__PURE__ */ jsx("p", {
		ref,
		className: cn("mt-1 text-xs text-[var(--muted)]", className),
		...props
	});
});
//#endregion
export { ScrollArea as a, TrackedAnchor as i, AlertDescription as n, DashboardPageViewTracker as o, AlertTitle as r, Input as s, Alert as t };

//# sourceMappingURL=alert-BmvSL5Kt.js.map