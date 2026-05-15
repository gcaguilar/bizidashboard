import { r as appRoutes } from "./routes-CFkMZBCM.js";
//#region src/lib/public-navigation.ts
var PUBLIC_PRIMARY_NAV_ITEMS = [
	{
		id: "home",
		label: "Inicio",
		href: appRoutes.home(),
		section: "primary",
		trackingRole: "home"
	},
	{
		id: "explore",
		label: "Explorar",
		href: appRoutes.explore(),
		section: "primary",
		trackingRole: "hub"
	},
	{
		id: "reports",
		label: "Informes",
		href: appRoutes.reports(),
		section: "primary",
		trackingRole: "hub"
	},
	{
		id: "dashboard",
		label: "Dashboard",
		href: appRoutes.dashboard(),
		section: "primary",
		trackingRole: "dashboard"
	}
];
var PUBLIC_UTILITY_NAV_ITEMS = [
	{
		id: "status",
		label: "Estado",
		href: appRoutes.status(),
		section: "utility",
		trackingRole: "utility"
	},
	{
		id: "api",
		label: "API",
		href: appRoutes.developers(),
		section: "utility",
		trackingRole: "utility"
	},
	{
		id: "help",
		label: "Metodologia",
		href: appRoutes.methodology(),
		section: "utility",
		trackingRole: "utility"
	}
];
var PUBLIC_NAV_ITEMS = [...PUBLIC_PRIMARY_NAV_ITEMS, ...PUBLIC_UTILITY_NAV_ITEMS];
function getPublicNavItem(id) {
	const item = PUBLIC_NAV_ITEMS.find((entry) => entry.id === id);
	if (!item) throw new Error(`Unknown public navigation item: ${id}`);
	return item;
}
function getExploreHubSections(options) {
	const latestMonthHref = options?.latestMonth ? appRoutes.reportMonth(options.latestMonth) : appRoutes.reports();
	return [
		{
			id: "operations",
			title: "Operacion y lectura rapida",
			description: "Herramientas para abrir el sistema en vivo, detectar friccion y moverse entre mapas y alertas sin perder contexto.",
			items: [
				{
					id: "stations",
					title: "Estaciones",
					eyebrow: "Directorio vivo",
					description: "Busca estaciones, entra al detalle operativo y abre predicciones, mapas y comparativas.",
					href: appRoutes.dashboardStations(),
					destinationLabel: "Dashboard > Operaciones"
				},
				{
					id: "alerts",
					title: "Alertas",
					eyebrow: "Incidencias y friccion",
					description: "Consulta alertas activas, severidad y el historial operativo para priorizar intervenciones.",
					href: appRoutes.dashboardAlerts(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "maps",
					title: "Mapas",
					eyebrow: "Vista cartografica",
					description: "Abre el mapa principal con filtros, geolocalizacion, densidad y contexto de disponibilidad.",
					href: appRoutes.dashboard(),
					destinationLabel: "Dashboard > Resumen"
				},
				{
					id: "system-kpis",
					title: "KPIs sistema",
					eyebrow: "Salud y cobertura",
					description: "Mide cobertura, lag, volumen y estado general del sistema desde una pagina publica.",
					href: appRoutes.status(),
					destinationLabel: "Pagina publica"
				},
				{
					id: "redistribucion",
					title: "Redistribucion",
					eyebrow: "Logistica y equilibrio",
					description: "Diagnostico de redistribucion con clasificacion de estaciones, predicciones y transferencias origen-destino sugeridas.",
					href: appRoutes.seoPage("redistribucion-bizi-zaragoza"),
					destinationLabel: "Landing publica"
				}
			]
		},
		{
			id: "analysis",
			title: "Analisis y descubrimiento",
			description: "Bloques para leer patrones temporales, comparar zonas y entender movilidad, demanda y comportamiento.",
			items: [
				{
					id: "flow",
					title: "Flujo",
					eyebrow: "Corredores urbanos",
					description: "Analiza movilidad agregada, corredores y balance entre zonas con una vista completa.",
					href: appRoutes.dashboardFlow(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "rankings",
					title: "Rankings",
					eyebrow: "Priorizacion",
					description: "Revisa estaciones con mayor uso, friccion o menor disponibilidad para decidir antes.",
					href: appRoutes.dashboardView("operations"),
					destinationLabel: "Dashboard > Operaciones"
				},
				{
					id: "heatmap",
					title: "Heatmap",
					eyebrow: "Lectura horaria",
					description: "Usa la capa de analisis para localizar horas punta, ocupacion y comportamiento por franja.",
					href: appRoutes.dashboardView("research"),
					destinationLabel: "Dashboard > Analisis"
				},
				{
					id: "compare",
					title: "Comparador",
					eyebrow: "Benchmarking",
					description: "Compara estaciones y contextos con estabilidad, uso relativo y señales recientes.",
					href: appRoutes.compare(),
					destinationLabel: "Pagina publica"
				},
				{
					id: "patterns",
					title: "Patrones",
					eyebrow: "Comportamiento intradia",
					description: "Explora tendencias horarias, volatilidad y regularidad para una estacion o el sistema.",
					href: appRoutes.dashboardView("research"),
					destinationLabel: "Dashboard > Analisis"
				},
				{
					id: "mobility",
					title: "Movilidad",
					eyebrow: "Origen y destino",
					description: "Sigue señales de salidas, llegadas y demanda agregada para lectura de movilidad urbana.",
					href: appRoutes.dashboardFlow(),
					destinationLabel: "Pagina dedicada"
				},
				{
					id: "districts",
					title: "Barrios",
					eyebrow: "Contexto territorial",
					description: "Abre comparativas territoriales y paginas publicas para lectura por barrio y distrito.",
					href: appRoutes.districtLanding(),
					destinationLabel: "Landing publica"
				}
			]
		},
		{
			id: "archive",
			title: "Historico y series",
			description: "Accesos para auditar cobertura, leer la evolucion temporal y enlazar informes mensuales persistentes.",
			items: [{
				id: "history",
				title: "Historico",
				eyebrow: "Auditoria del dataset",
				description: "Consulta historico agregado, exportaciones y trazabilidad de los datos compartidos.",
				href: appRoutes.dashboardView("data"),
				destinationLabel: "Dashboard > Datos"
			}, {
				id: "time-series",
				title: "Series temporales",
				eyebrow: "Archivo por periodos",
				description: "Entra al mes mas reciente o al archivo completo para seguir demanda, ocupacion y balance.",
				href: latestMonthHref,
				destinationLabel: options?.latestMonth ? `Informe ${options.latestMonth}` : "Archivo mensual"
			}]
		}
	];
}
//#endregion
export { getPublicNavItem as a, getExploreHubSections as i, PUBLIC_PRIMARY_NAV_ITEMS as n, PUBLIC_UTILITY_NAV_ITEMS as r, PUBLIC_NAV_ITEMS as t };

//# sourceMappingURL=public-navigation-7kjot5UZ.js.map