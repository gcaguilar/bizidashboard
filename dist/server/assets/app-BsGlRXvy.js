import { n as init_page_shell, t as PageShell } from "./page-shell-CC8M_45q.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/index.tsx?tsr-split=component
init_page_shell();
function Home() {
	return /* @__PURE__ */ jsxs(PageShell, {
		className: "gap-8 py-8 md:py-12",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "ui-page-hero",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-start justify-between gap-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-4xl",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
								children: "Panel publico y rutas indexables"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl",
								children: "DatosBizi: Estaciones Bizi Zaragoza"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 text-sm text-[var(--muted)] md:text-base",
								children: "Consulta estaciones Bizi Zaragoza, disponibilidad actual, patrones de uso, barrios, rankings, informes mensuales y datos abiertos desde una unica capa publica."
							})
						]
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3 mt-4",
					children: [/* @__PURE__ */ jsx("a", {
						href: "/dashboard",
						className: "inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95",
						children: "Abrir dashboard principal"
					}), /* @__PURE__ */ jsx("a", {
						href: "/uso-bizi-por-estacion",
						className: "ui-inline-action",
						children: "Explorar estaciones publicas"
					})]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "ui-section-card",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
						children: "Como usar la capa publica"
					}), /* @__PURE__ */ jsx("h2", {
						className: "text-xl font-black leading-tight text-[var(--foreground)]",
						children: "Mejor pocas rutas utiles que muchas paginas vacias"
					})] }), /* @__PURE__ */ jsx("p", { children: "DatosBizi combina lectura rapida para usuarios y estructura clara para buscadores." })]
				})
			}),
			/* @__PURE__ */ jsx("section", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: [
					{
						href: "/dashboard",
						title: "Dashboard en vivo",
						desc: "Mapa, alertas, flujo y lecturas operativas del sistema actual."
					},
					{
						href: "/uso-bizi-por-estacion",
						title: "Hub de estaciones",
						desc: "Fichas publicas, disponibilidad, patrones y acceso al detalle operativo."
					},
					{
						href: "/barrios-bizi-zaragoza",
						title: "Barrios con cobertura",
						desc: "Contexto territorial, estaciones destacadas y comparativa local por barrio."
					},
					{
						href: "/informes",
						title: "Archivo mensual",
						desc: "Informes indexables por mes con enlaces persistentes y contexto historico."
					},
					{
						href: "/estado",
						title: "Estado del sistema",
						desc: "Frescura de datos, volumen reciente y diagnostico rapido."
					},
					{
						href: "/developers",
						title: "Developers y API",
						desc: "OpenAPI, ejemplos de consumo, CSV y documentacion reutilizable."
					}
				].map((link) => /* @__PURE__ */ jsxs("a", {
					href: link.href,
					className: "ui-section-card transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]",
							children: "Acceso rapido"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-2 text-xl font-black text-[var(--foreground)]",
							children: link.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-[var(--muted)]",
							children: link.desc
						})
					]
				}, link.href))
			})
		]
	});
}
//#endregion
export { Home as component };
