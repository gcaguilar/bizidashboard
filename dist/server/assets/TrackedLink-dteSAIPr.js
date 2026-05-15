import { c as buildNavigationClickEvent, f as resolveRouteKeyFromPathname, i as buildEntitySelectEvent, p as trackUmamiEvent, s as buildLegacyInteractionEvent, t as buildCtaClickEvent } from "./umami-BYNhNb0r.js";
import { Link, useLocation } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
//#region src/app/_components/TrackedLink.tsx
function TrackedLink({ children, href, eventName, eventData, trackingEvent, navigationEvent, ctaEvent, entitySelectEvent, onClick, className, ...otherProps }) {
	const pathname = useLocation().pathname;
	const to = href;
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
	return /* @__PURE__ */ jsx(Link, {
		to,
		onClick: handleClick,
		className: `${className ?? ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim(),
		children
	});
}
//#endregion
export { TrackedLink as t };

//# sourceMappingURL=TrackedLink-dteSAIPr.js.map