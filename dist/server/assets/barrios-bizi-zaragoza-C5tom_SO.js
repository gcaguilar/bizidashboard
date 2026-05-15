import { t as SeoLandingPageComponent } from "./SeoLandingPageComponent-DMG_PIqe.js";
import { t as Route } from "./barrios-bizi-zaragoza-DrmqW1sH.js";
import { Suspense } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/app/barrios-bizi-zaragoza.tsx?tsr-split=component
function BarriosBiziZaragozaPage() {
	const { config, content, indexability } = Route.useLoaderData();
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: /* @__PURE__ */ jsx("div", { children: "Cargando..." }),
		children: /* @__PURE__ */ jsx(SeoLandingPageComponent, {
			slug: "barrios-bizi-zaragoza",
			config,
			content,
			indexability
		})
	});
}
//#endregion
export { BarriosBiziZaragozaPage as component };

//# sourceMappingURL=barrios-bizi-zaragoza-C5tom_SO.js.map