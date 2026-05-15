import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { f as getSiteUrl, l as getCityName, r as appRoutes } from "./routes-CFkMZBCM.js";
import { n as createRootBreadcrumbs } from "./breadcrumbs-tXG_cMah.js";
import { a as getApiVersionLabel, f as openApiDocument, s as getDatasetVersionLabel } from "./system-status-BnLkTU-r.js";
import { t as combineDataStates } from "./data-state-UX6jPIR_.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { i as buildFallbackStatus, n as buildFallbackDatasetSnapshot, t as buildFallbackAvailableMonths } from "./shared-data-fallbacks-BAmlHD2N.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
//#region src/server-functions/developers.ts?tss-serverfn-split
function getEndpointDocs() {
	return Object.entries(openApiDocument.paths).filter(([path]) => path !== "/api/docs").flatMap(([path, operations]) => Object.entries(operations).map(([method, operation]) => {
		const operationRecord = operation;
		return {
			path,
			method: method.toUpperCase(),
			summary: operationRecord.summary ?? "Operacion disponible",
			params: Array.isArray(operationRecord.parameters) ? operationRecord.parameters.map((param) => String(param.name ?? "")) : []
		};
	})).sort((left, right) => left.path.localeCompare(right.path, "es"));
}
var getDevelopersPageData_createServerFn_handler = createServerRpc({
	id: "4643f90b7e17a4d097baa85ab643dcb7882b4d9aef6e997d27c6e62bb8953359",
	name: "getDevelopersPageData",
	filename: "src/server-functions/developers.ts"
}, (opts) => getDevelopersPageData.__executeServer(opts));
var getDevelopersPageData = createServerFn({ method: "GET" }).handler(getDevelopersPageData_createServerFn_handler, async () => {
	const { fetchAvailableDataMonths, fetchSharedDatasetSnapshot, fetchStatus } = await import("./api-Yqzm2GiC.js");
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const siteUrl = getSiteUrl();
	const [dataset, availableMonths, status] = await Promise.all([
		fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
		fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
		fetchStatus().catch(() => buildFallbackStatus(nowIso))
	]);
	const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
	const endpointDocs = getEndpointDocs();
	const datasetVersion = getDatasetVersionLabel(dataset);
	const apiVersion = getApiVersionLabel();
	const codeLicense = process.env.npm_package_license ?? "GPL-3.0-only";
	const developersDataState = combineDataStates([dataset.dataState, status.dataState]);
	const datasetTemporalCoverage = dataset.coverage.firstRecordedAt && dataset.coverage.lastRecordedAt ? `${dataset.coverage.firstRecordedAt}/${dataset.coverage.lastRecordedAt}` : void 0;
	const curlExamples = [
		`curl -s -H "X-Request-Id: docs-example-status" ${siteUrl}${appRoutes.api.status()}`,
		`curl -sG ${siteUrl}${appRoutes.api.rankings({
			type: "turnover",
			limit: 20
		})}`,
		`curl -L -H "x-public-api-key: $PUBLIC_API_KEY" ${siteUrl}${appRoutes.api.historyCsv()}`
	];
	const pythonExample = `import requests\n\nbase_url = "${siteUrl}"\nresponse = requests.get(f"{base_url}${appRoutes.api.status()}", timeout=15)\nresponse.raise_for_status()\npayload = response.json()\nprint(payload["pipeline"]["healthStatus"])`;
	const jsExample = `const response = await fetch("${siteUrl}${appRoutes.api.stations()}");\nif (!response.ok) throw new Error(\`HTTP \${response.status}\`);\nconst payload = await response.json();\nconsole.log(payload.stations.length);`;
	const csvDownloads = [
		{
			label: "Estado actual de estaciones",
			href: appRoutes.api.stations({ format: "csv" }),
			detail: "Snapshot actual en CSV con bicis, anclajes y capacidad. Acceso anonimo."
		},
		{
			label: "Ranking de friccion",
			href: appRoutes.api.rankings({
				type: "availability",
				limit: 200,
				format: "csv"
			}),
			detail: "Horas problema y riesgo de disponibilidad por estacion. Acceso anonimo."
		},
		{
			label: "Resumen del sistema",
			href: appRoutes.api.status({ format: "csv" }),
			detail: "Estado del pipeline, frescura y volumen reciente. Acceso anonimo."
		}
	];
	const accessPolicies = [
		{
			label: "Correlacion",
			title: "Todas las respuestas API devuelven `X-Request-Id`",
			detail: "Si el cliente envia su propio identificador se reutiliza en logs, Sentry, auditoria y ejecuciones operativas."
		},
		{
			label: "Ops",
			title: "`GET/POST /api/collect` requieren `X-Ops-Api-Key`",
			detail: "La cabecera `x-collect-api-key` sigue aceptandose temporalmente como alias de compatibilidad para cron antiguos."
		},
		{
			label: "Elevated public",
			title: "CSV costosos y ventanas amplias requieren `X-Public-Api-Key`",
			detail: "Afecta a historico CSV, alertas historicas CSV, movilidad extendida y rebalancing con ventanas o exportaciones amplias."
		},
		{
			label: "Mobile",
			title: "`Authorization` + `X-Installation-Id` en auth movil",
			detail: "Geo search y geo reverse soportan firma HMAC (`timestamp` + `signature`) y el backend puede volverla obligatoria por feature flag."
		}
	];
	const useCases = [
		"Supervision operativa del sistema y cuadros de mando internos.",
		"Periodismo de datos y storytelling sobre movilidad urbana.",
		"Investigacion sobre demanda, equilibrio y comportamiento horario.",
		"Integraciones con apps moviles, paneles de ciudad o herramientas GIS."
	];
	const changelog = [
		`v${apiVersion}: especificacion OpenAPI publicada y accesible para tooling.`,
		"Version actual: request tracing con `X-Request-Id`, collect protegido por clave operativa y auditoria persistente para auth, rate limits y ejecuciones.",
		`Dataset ${datasetVersion}: cobertura compartida con ${dataset.coverage.totalDays} dias y ${dataset.stats.totalSamples} muestras agregadas.`
	];
	const datasetDownloadEntries = csvDownloads.map((item) => ({
		name: item.label,
		url: `${siteUrl}${item.href}`
	}));
	return {
		siteUrl,
		cityName: getCityName(),
		breadcrumbs: createRootBreadcrumbs({
			label: "Developers",
			href: appRoutes.developers()
		}),
		latestMonth,
		endpointDocs,
		datasetVersion,
		apiVersion,
		codeLicense,
		developersDataState,
		datasetTemporalCoverage,
		curlExamples,
		pythonExample,
		jsExample,
		csvDownloads,
		accessPolicies,
		useCases,
		changelog,
		datasetDownloadEntries,
		dataset
	};
});
//#endregion
export { getDevelopersPageData_createServerFn_handler };

//# sourceMappingURL=developers-DhfbPjFb.js.map