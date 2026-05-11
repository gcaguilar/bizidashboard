import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as buildEntitySelectEvent, c as buildLegacyInteractionEvent, h as trackUmamiEvent, l as buildNavigationClickEvent, m as resolveRouteKeyFromPathname, n as buildCtaClickEvent, p as init_umami } from "./TrackedLink-BHId783N.js";
import { useLocation } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
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
var init_TrackedAnchor = __esmMin((() => {
	init_umami();
}));
//#endregion
export { init_TrackedAnchor as n, TrackedAnchor as t };
