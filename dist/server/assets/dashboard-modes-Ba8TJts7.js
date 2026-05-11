//#region src/lib/dashboard-modes.ts
var DASHBOARD_VIEW_MODES = [
	"overview",
	"operations",
	"research",
	"data"
];
var DASHBOARD_MODE_META = {
	overview: {
		label: "Resumen",
		shortLabel: "Resumen",
		description: "Vision ejecutiva y estado global",
		introEyebrow: "Resumen ejecutivo",
		introTitle: "Lo importante de un vistazo",
		introDescription: "Pensado para entender rapido el estado general del sistema, su equilibrio y las señales clave del dia.",
		introTone: "from-rose-500/12 via-transparent to-transparent border-rose-500/25"
	},
	operations: {
		label: "Operaciones",
		shortLabel: "Operaciones",
		description: "Friccion, alertas y accion operativa",
		introEyebrow: "Modo operaciones",
		introTitle: "Priorizar y actuar antes",
		introDescription: "Enfocado en estaciones criticas, alertas, friccion y decisiones operativas inmediatas.",
		introTone: "from-amber-500/14 via-transparent to-transparent border-amber-500/25"
	},
	research: {
		label: "Analisis",
		shortLabel: "Analisis",
		description: "Patrones, demanda y flujo urbano",
		introEyebrow: "Modo analisis",
		introTitle: "Entender patrones y comportamiento",
		introDescription: "Pensado para leer tendencias temporales, estabilidad y flujo entre zonas sin perder contexto.",
		introTone: "from-sky-500/14 via-transparent to-transparent border-sky-500/25"
	},
	data: {
		label: "Datos",
		shortLabel: "Datos",
		description: "Metodologia, trazabilidad y acceso",
		introEyebrow: "Modo datos",
		introTitle: "Transparencia, trazabilidad y exportacion",
		introDescription: "Reune metodologia, historicos y salidas de datos para auditar o reutilizar la informacion.",
		introTone: "from-emerald-500/14 via-transparent to-transparent border-emerald-500/25"
	}
};
function resolveDashboardViewMode(value) {
	if (value && DASHBOARD_VIEW_MODES.includes(value)) return value;
	return "overview";
}
//#endregion
export { DASHBOARD_VIEW_MODES as n, resolveDashboardViewMode as r, DASHBOARD_MODE_META as t };
