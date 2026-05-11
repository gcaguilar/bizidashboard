import { t as Route } from "./route-BgHQb38F.js";
import { jsxs } from "react/jsx-runtime";
//#region src/app/dashboard/views/[mode]/route.tsx?tsr-split=component
function DashboardViewModePage() {
	const { mode } = Route.useParams();
	return /* @__PURE__ */ jsxs("div", { children: ["Dashboard view mode: ", mode] });
}
//#endregion
export { DashboardViewModePage as component };
