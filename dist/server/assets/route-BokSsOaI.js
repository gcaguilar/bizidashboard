import { n as init_page_shell, t as PageShell } from "./page-shell-CC8M_45q.js";
import { _ as SiteBreadcrumbs, o as createRootBreadcrumbs } from "./shared-data-fallbacks-BSFw5LEs.js";
import { i as formatMonthLabel } from "./cache-DMRFuswD.js";
import { p as shouldShowDataStateNotice } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { t as DataStateNotice } from "./DataStateNotice-BAkqjtQM.js";
import { a as PublicSectionNav, t as Route } from "./route-CribxMSv.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/informes/[month]/route.tsx?tsr-split=component
init_routes();
init_page_shell();
function InformesMonthPage() {
	const { month, dataState } = Route.useLoaderData();
	return /* @__PURE__ */ jsxs(PageShell, { children: [
		/* @__PURE__ */ jsx("div", {
			className: "mx-auto mb-4 w-full max-w-[1280px]",
			children: /* @__PURE__ */ jsx(SiteBreadcrumbs, { items: createRootBreadcrumbs({
				label: "Informes",
				href: appRoutes.reports()
			}) })
		}),
		/* @__PURE__ */ jsx(PublicSectionNav, {
			activeItemId: "reports",
			className: "mt-1"
		}),
		/* @__PURE__ */ jsx("header", {
			className: "ui-page-hero",
			children: /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-start justify-between gap-4",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-4xl",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Informe mensual"
						}),
						/* @__PURE__ */ jsxs("h1", {
							className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl",
							children: ["Informe ", formatMonthLabel(month)]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-sm text-[var(--muted)] md:text-base",
							children: "Curva de demanda y metricas del mes seleccionado."
						})
					]
				})
			})
		}),
		shouldShowDataStateNotice(dataState) ? /* @__PURE__ */ jsx(DataStateNotice, {
			state: dataState,
			subject: "el informe mensual",
			description: "Los datos del informe dependen del estado del dataset.",
			href: appRoutes.status(),
			actionLabel: "Ver estado"
		}) : null,
		/* @__PURE__ */ jsx("section", {
			className: "ui-section-card",
			children: /* @__PURE__ */ jsxs("p", {
				className: "text-sm text-[var(--muted)]",
				children: [
					"Proximamente: curva de demanda y metricas para ",
					formatMonthLabel(month),
					"."
				]
			})
		})
	] });
}
//#endregion
export { InformesMonthPage as component };
