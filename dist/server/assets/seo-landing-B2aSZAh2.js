import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as resolveRouteKeyFromPathname, p as trackUmamiEvent, u as buildPublicPageViewEvent } from "./umami-BYNhNb0r.js";
import { t as createSsrRpc } from "./createSsrRpc-BFE1gq-C.js";
import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { z } from "zod";
//#region src/app/_components/PublicPageViewTracker.tsx
function PublicPageViewTracker({ routeKey, pageType, template, pageSlug, entityId }) {
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
			pageSlug ?? "",
			entityId ?? ""
		].join("|");
		if (lastTrackedKey.current === trackingKey) return;
		lastTrackedKey.current = trackingKey;
		trackUmamiEvent(buildPublicPageViewEvent({
			routeKey: resolvedRouteKey,
			pageType,
			template
		}));
	}, [
		entityId,
		pageSlug,
		pageType,
		pathname,
		routeKey,
		template
	]);
	return null;
}
//#endregion
//#region src/server-functions/seo-landing.ts
var SeoLandingInputSchema = z.object({ slug: z.string() });
var fetchSeoLandingData = createServerFn({ method: "GET" }).inputValidator(SeoLandingInputSchema).handler(createSsrRpc("882d45c904d5872d91369621001ddf3e262612daf5303e1a57c293e366022fb5"));
//#endregion
export { PublicPageViewTracker as n, fetchSeoLandingData as t };

//# sourceMappingURL=seo-landing-B2aSZAh2.js.map