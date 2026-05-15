import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
import { z } from "zod";
//#region src/server-functions/dashboard-redistribucion.ts?tss-serverfn-split
var RebalancingSearchParamsSchema = z.object({
	sort: z.union([z.string(), z.array(z.string())]).optional(),
	filter: z.union([z.string(), z.array(z.string())]).optional(),
	search: z.union([z.string(), z.array(z.string())]).optional(),
	page: z.union([z.string(), z.array(z.string())]).optional(),
	pageSize: z.union([z.string(), z.array(z.string())]).optional()
}).default({});
var getFirst = (value) => Array.isArray(value) ? value[0] : value;
var getDashboardRebalancingPageData_createServerFn_handler = createServerRpc({
	id: "67a06b4f5a19b3a11e7d26444e7ddddf2b16f6bcd3f3a0d3e1678de310ce0673",
	name: "getDashboardRebalancingPageData",
	filename: "src/server-functions/dashboard-redistribucion.ts"
}, (opts) => getDashboardRebalancingPageData.__executeServer(opts));
var getDashboardRebalancingPageData = createServerFn({ method: "GET" }).inputValidator(RebalancingSearchParamsSchema).handler(getDashboardRebalancingPageData_createServerFn_handler, async ({ data: params }) => {
	const sort = getFirst(params?.sort);
	const filter = getFirst(params?.filter);
	const search = getFirst(params?.search);
	const page = getFirst(params?.page);
	const pageSize = getFirst(params?.pageSize);
	const tableParams = {
		sort: sort?.includes(":") ? sort : void 0,
		filter: filter?.includes(":") ? filter : void 0,
		search,
		page: page ? Number(page) : void 0,
		pageSize: pageSize ? Number(pageSize) : void 0
	};
	const { buildRebalancingReport } = await import("./rebalancing-report-BxPKhPhK.js");
	const { fetchDistrictCollection } = await import("./districts.server-B_XrONTP.js");
	const [report, districtCollection] = await Promise.all([buildRebalancingReport({ days: 15 }), fetchDistrictCollection().catch(() => null)]);
	return {
		report,
		districtNames: districtCollection ? [...new Set(districtCollection.features.map((feature) => feature.properties?.distrito).filter((district) => typeof district === "string"))].sort((left, right) => left.localeCompare(right, "es")) : [],
		tableParams
	};
});
//#endregion
export { getDashboardRebalancingPageData_createServerFn_handler };

//# sourceMappingURL=dashboard-redistribucion-ziybAMgp.js.map