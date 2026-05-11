import { n as ANALYTICS_WINDOWS, t as ALERT_THRESHOLDS } from "./types-DMKIRG7H.js";
import { r as init_button, t as Button } from "./button-CZXsd1v7.js";
import { n as appRoutes, r as init_routes } from "./routes-DkqafPzE.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/_components/MethodologyPanel.tsx
init_button();
init_routes();
var QUICK_FAQ = [
	{
		question: "Como se detecta una alerta activa?",
		answer: `Miramos las ultimas ${ANALYTICS_WINDOWS.alertWindowHours} horas. Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, entra en alerta.`
	},
	{
		question: "Que significa horas problema?",
		answer: "Es el tiempo acumulado con riesgo operativo: pocas bicis o pocos anclajes. Mas horas problema = mas necesidad de actuar."
	},
	{
		question: "Como se estima la matriz O-D?",
		answer: "Se estima con cambios de disponibilidad por hora y se agrupa por distritos. Sirve para ver tendencias, no viajes individuales exactos."
	},
	{
		question: "Como se calculan las rutas destacadas?",
		answer: "Se reparte el flujo saliente de cada distrito entre destinos segun su peso de entradas en esa franja. Son rutas probables, no trazas GPS."
	},
	{
		question: "Que significa prediccion en el dashboard?",
		answer: "Las predicciones (+30/+60 min) anticipan disponibilidad con historico + estado reciente. Ayudan a prevenir, pero no garantizan el valor final."
	}
];
function MethodologyPanel() {
	return /* @__PURE__ */ jsxs("section", {
		className: "ui-section-card",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-[var(--foreground)]",
					children: "Centro de ayuda rapido"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Metodologia, interpretacion de metricas y preguntas frecuentes."
				})] }), /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "cta",
					size: "sm",
					className: "rounded-full",
					children: /* @__PURE__ */ jsx(Link, {
						to: appRoutes.dashboardHelp(),
						children: "Ir a la ayuda completa"
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-3",
				children: QUICK_FAQ.map((item) => /* @__PURE__ */ jsxs("article", {
					className: "rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-[var(--foreground)]",
						children: item.question
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-[var(--muted)]",
						children: item.answer
					})]
				}, item.question))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 text-xs text-[var(--muted)]",
				children: "Si una seccion todavia no tiene historico suficiente o una capacidad avanzada activa, el dashboard muestra el bloque igualmente y explica por que falta ese dato."
			})
		]
	});
}
//#endregion
export { MethodologyPanel as t };
