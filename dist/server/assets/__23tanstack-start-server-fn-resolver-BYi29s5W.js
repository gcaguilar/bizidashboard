//#region \0%23tanstack-start-server-fn-resolver
var manifest = {
	"04762fe687ea0dcaa2d458e8cb5d494d0477a23b4c4d628af70688f6f14bc622": {
		functionName: "getDashboardFlowPageData_createServerFn_handler",
		importer: () => import("./dashboard-flujo-DacjQVPB.js")
	},
	"083e3742173ffbee241fcf450e7767671296bf68a466a3e51f01b0bc90fd0d5f": {
		functionName: "getReportsIndexPageData_createServerFn_handler",
		importer: () => import("./informes-BPxmp1Mm.js")
	},
	"0a5156d1d525c55699258b3d5703698ee35c110d7c00c290c72631d50b759569": {
		functionName: "getStationsDirectoryPageData_createServerFn_handler",
		importer: () => import("./dashboard-estaciones-BUXfi_77.js")
	},
	"0be1a2a4f9142947396989b2bd788015e0fd320339b9ffa060d5df909ae7151b": {
		functionName: "getStationDetailPageData_createServerFn_handler",
		importer: () => import("./dashboard-estaciones-BUXfi_77.js")
	},
	"11dcf17e9b708291fd9c9de38dc41400f5fd9c701b169868a9374fcd97ad78f9": {
		functionName: "getAlertsHistoryPageData_createServerFn_handler",
		importer: () => import("./dashboard-alertas-BGPBLsBn.js")
	},
	"147ad74b602921a748fa48795bb7b08c723411824c9d26fde2ee6a409f1e721d": {
		functionName: "getSystemStatusPageData_createServerFn_handler",
		importer: () => import("./estado-C-XxJhhU.js")
	},
	"208f6947a49512a93c0644ebc4d1a86df8024fe31b051ca92504a1387cb6526f": {
		functionName: "getUtilityLandingPageData_createServerFn_handler",
		importer: () => import("./seo-details-yygfxF5S.js")
	},
	"4643f90b7e17a4d097baa85ab643dcb7882b4d9aef6e997d27c6e62bb8953359": {
		functionName: "getDevelopersPageData_createServerFn_handler",
		importer: () => import("./developers-DhfbPjFb.js")
	},
	"4cacafda8f5bee1f11533a32bcce837e053773389524fed5f8533a6fc360b145": {
		functionName: "getCompareHubLoaderData_createServerFn_handler",
		importer: () => import("./comparar-DWfvvFwI.js")
	},
	"4ed98d1c8366c97bab768ea181066c1eb1c65c99dce74deccfd1d31982a3057d": {
		functionName: "getInsightsLandingPageData_createServerFn_handler",
		importer: () => import("./seo-details-yygfxF5S.js")
	},
	"53c3c38829d0db0e8ea4ec1fcd6859ec1dd8fed78f3fc1dfa4371f6bc429e767": {
		functionName: "getDashboardPageData_createServerFn_handler",
		importer: () => import("./dashboard-Cw1rww0E.js")
	},
	"6231b012c61057b04c6002b137b8ffc952f478a147208c513ed41398b06485bf": {
		functionName: "getPublicDistrictPageData_createServerFn_handler",
		importer: () => import("./seo-details-yygfxF5S.js")
	},
	"646e488c0be3026872095ee83795e3920c6dcaf349f46636cc18843a729f3a63": {
		functionName: "getDashboardHelpPageData_createServerFn_handler",
		importer: () => import("./dashboard-ayuda-getDnyzq.js")
	},
	"67a06b4f5a19b3a11e7d26444e7ddddf2b16f6bcd3f3a0d3e1678de310ce0673": {
		functionName: "getDashboardRebalancingPageData_createServerFn_handler",
		importer: () => import("./dashboard-redistribucion-ziybAMgp.js")
	},
	"6834c12f4a52abfd80f4941f691d53b91dc95be5ee5b5244475cd16dcbdd9a0a": {
		functionName: "getPublicStationPageData_createServerFn_handler",
		importer: () => import("./seo-details-yygfxF5S.js")
	},
	"882d45c904d5872d91369621001ddf3e262612daf5303e1a57c293e366022fb5": {
		functionName: "fetchSeoLandingData_createServerFn_handler",
		importer: () => import("./seo-landing-BnYH-uFn.js")
	},
	"a7f5d18063e64432c5fea2a43925ceb4a9474306145734251001c00553c9a4f0": {
		functionName: "getExploreLoaderData_createServerFn_handler",
		importer: () => import("./explorar-DlZwuVLo.js")
	},
	"c0c5da713c439bcbb02ef22c145b5ad04b5547afe2bc5c7f7abdfb47c772240c": {
		functionName: "getMethodologyPageData_createServerFn_handler",
		importer: () => import("./metodologia-0W6V_lq7.js")
	},
	"dc845a127500254115ce8f0ae45918b425dd0b630e2779e5a8cbf39ad25d1536": {
		functionName: "getReportMonthPageData_createServerFn_handler",
		importer: () => import("./informes-month-CvZkqyxi.js")
	},
	"e14cbb00cd4fa5986b5e4962968e9745a8544f807387b1991c79f6a48ca00c1e": {
		functionName: "getDashboardConclusionsPageData_createServerFn_handler",
		importer: () => import("./dashboard-conclusiones-CChHVe8h.js")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
