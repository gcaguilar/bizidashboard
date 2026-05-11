import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, i as init_badge, n as init_card, o as init_utils, r as Badge, t as Card } from "./card-BqIrN6Ld.js";
import { r as init_constants, t as CITY_CONFIGS } from "./constants-CkURxSfD.js";
import { i as getCurrentCityKey, o as init_site } from "./site-B6Gst4bb.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/_components/CitySwitcher.tsx
init_badge();
init_card();
init_constants();
init_site();
function getCitySwitcherItems() {
	const currentCity = getCurrentCityKey();
	return [{
		city: currentCity,
		label: CITY_CONFIGS[currentCity].name,
		statusLabel: "Activa en esta instalacion",
		isActive: true
	}];
}
function CitySwitcher({ className, compact = false }) {
	const items = getCitySwitcherItems();
	return /* @__PURE__ */ jsx("section", {
		"aria-label": "Ciudad activa en esta instalacion",
		className,
		children: /* @__PURE__ */ jsxs(Card, {
			variant: "stat",
			className: "rounded-2xl bg-[var(--secondary)] px-3 py-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]",
					children: "Ciudad"
				}), !compact ? /* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: "Esta instalacion publica esta operativa solo para Zaragoza y refleja aqui la ciudad disponible."
				}) : null] }), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-2",
					children: items.map((item) => /* @__PURE__ */ jsxs("div", {
						"aria-label": item.isActive ? `${item.label} activa en esta instalacion` : item.label,
						className: `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${item.isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"}`,
						children: [/* @__PURE__ */ jsx("span", { children: item.label }), /* @__PURE__ */ jsx(Badge, {
							variant: "muted",
							className: `rounded-full border-transparent px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] ${item.isActive ? "bg-white/18 text-white" : "bg-black/5 text-[var(--muted)]"}`,
							children: item.isActive ? "Activa" : "Roadmap"
						})]
					}, item.city))
				})]
			}), !compact ? /* @__PURE__ */ jsxs("p", {
				className: "mt-2 text-[11px] text-[var(--muted)]",
				children: [items.find((item) => item.isActive)?.statusLabel ?? "Sin ciudad activa declarada", "."]
			}) : null]
		})
	});
}
//#endregion
//#region src/components/layout/page-shell.tsx
function PageShell({ as = "main", className, children, maxWidthClassName = "max-w-[1280px]", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		className: cn("mx-auto flex min-h-screen w-full flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8", maxWidthClassName, className),
		...props,
		children
	});
}
var init_page_shell = __esmMin((() => {
	init_utils();
}));
//#endregion
export { init_page_shell as n, CitySwitcher as r, PageShell as t };
