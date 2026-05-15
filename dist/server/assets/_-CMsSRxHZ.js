import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/$.tsx?tsr-split=notFoundComponent
function NotFoundPage() {
	return /* @__PURE__ */ jsx(PageShell, { children: /* @__PURE__ */ jsxs("section", {
		className: "ui-page-hero py-24 text-center",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "text-4xl font-black text-[var(--foreground)]",
				children: "Pagina no encontrada"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 text-sm text-[var(--muted)]",
				children: "La ruta que buscas no existe o ha sido movida."
			}),
			/* @__PURE__ */ jsx("a", {
				href: "/",
				className: "ui-inline-action mt-6",
				children: "Volver al inicio"
			})
		]
	}) });
}
//#endregion
export { NotFoundPage as notFoundComponent };

//# sourceMappingURL=_-CMsSRxHZ.js.map