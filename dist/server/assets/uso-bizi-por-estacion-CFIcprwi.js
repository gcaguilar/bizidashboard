import { t as SeoLandingPageComponent } from "./SeoLandingPageComponent-DMG_PIqe.js";
import { t as Route } from "./uso-bizi-por-estacion-DXLxILJC.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/uso-bizi-por-estacion.tsx?tsr-split=component
function UsoBiziPorEstacionPage() {
	const data = Route.useLoaderData();
	const { config, content, indexability } = data ?? {};
	if (!config) return /* @__PURE__ */ jsxs("div", { children: ["Error: config is undefined. Data keys: ", data ? Object.keys(data).join(", ") : "no data"] });
	return /* @__PURE__ */ jsx(SeoLandingPageComponent, {
		slug: "uso-bizi-por-estacion",
		config,
		content,
		indexability
	});
}
//#endregion
export { UsoBiziPorEstacionPage as component };

//# sourceMappingURL=uso-bizi-por-estacion-CFIcprwi.js.map