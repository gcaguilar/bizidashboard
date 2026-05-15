import { r as createServerFn } from "./esm-DmkRHfL6.js";
import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { r as isValidMonthKey } from "./months-CotCm8RF.js";
import { t as createServerRpc } from "./createServerRpc-Daetk-Ek.js";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
//#region src/server-functions/informes-month.ts?tss-serverfn-split
var MonthInputSchema = z.string().optional();
var getReportMonthPageData_createServerFn_handler = createServerRpc({
	id: "dc845a127500254115ce8f0ae45918b425dd0b630e2779e5a8cbf39ad25d1536",
	name: "getReportMonthPageData",
	filename: "src/server-functions/informes-month.ts"
}, (opts) => getReportMonthPageData.__executeServer(opts));
var getReportMonthPageData = createServerFn({ method: "GET" }).inputValidator(MonthInputSchema).handler(getReportMonthPageData_createServerFn_handler, async ({ data: month }) => {
	if (!month || !isValidMonthKey(month)) throw redirect({ to: appRoutes.reports() });
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	try {
		const [{ fetchCachedMonthlyDemandCurve }, { buildFallbackDatasetSnapshot }] = await Promise.all([import("./analytics-series-C83eMGJo.js"), import("./shared-data-fallbacks-M_Upqoba.js")]);
		await fetchCachedMonthlyDemandCurve().catch(() => buildFallbackDatasetSnapshot(nowIso));
		return {
			month,
			dataState: "ok"
		};
	} catch (error) {
		captureExceptionWithContext(error, {
			area: "informes.month",
			operation: "loader"
		});
		return {
			month,
			dataState: "error"
		};
	}
});
//#endregion
export { getReportMonthPageData_createServerFn_handler };

//# sourceMappingURL=informes-month-CvZkqyxi.js.map