import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
//#region src/app/_components/ServiceWorkerRegister.tsx
function ServiceWorkerRegister() {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
		const registerServiceWorker = async () => {
			try {
				await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
			} catch (error) {
				captureExceptionWithContext(error, {
					area: "pwa.service-worker",
					operation: "register"
				});
				console.error("[PWA] No se pudo registrar el service worker.", error);
			}
		};
		const timeoutId = window.setTimeout(() => {
			registerServiceWorker();
		}, 1500);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);
	return null;
}
//#endregion
//#region src/app/dashboard/route.tsx?tsr-split=component
function DashboardParentRoute() {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ServiceWorkerRegister, {})] });
}
//#endregion
export { DashboardParentRoute as component };

//# sourceMappingURL=route-Cx7vJ1gr.js.map