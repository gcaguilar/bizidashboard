import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as PublicSectionNav } from "./PublicSectionNav-Yd_6xRYh.js";
import { n as SiteBreadcrumbs } from "./createSsrRpc-BFE1gq-C.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { u as shouldShowDataStateNotice } from "./data-state-UX6jPIR_.js";
import { t as DataStateNotice } from "./DataStateNotice-Dzz1drH7.js";
import { t as formatMonthLabel } from "./months-CotCm8RF.js";
import { t as Route } from "./informes._month-Dwp8Qz03.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/informes.$month.tsx?tsr-split=component
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

//# sourceMappingURL=informes._month-DeSrgQ7I.js.map