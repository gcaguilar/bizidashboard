import { t as TrackedLink } from "./TrackedLink-dteSAIPr.js";
import { i as AccordionTrigger, n as AccordionContent, r as AccordionItem, t as Accordion } from "./accordion-Cl6-ndDy.js";
import { a as getPublicNavItem, n as PUBLIC_PRIMARY_NAV_ITEMS, r as PUBLIC_UTILITY_NAV_ITEMS, t as PUBLIC_NAV_ITEMS } from "./public-navigation-7kjot5UZ.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app/_components/PublicSectionNav.tsx
var MOBILE_PRIMARY_NAV_IDS = [
	"explore",
	"reports",
	"dashboard"
];
var MOBILE_COMPACT_NAV_LIMIT = 3;
function getMobileCompactNav(activeItemId) {
	const activeItem = getPublicNavItem(activeItemId);
	const mobilePrimaryNavItems = MOBILE_PRIMARY_NAV_IDS.map((id) => getPublicNavItem(id));
	if (activeItem.id === "home") return {
		visibleItems: [
			getPublicNavItem("home"),
			getPublicNavItem("explore"),
			getPublicNavItem("reports")
		],
		overflowItems: [getPublicNavItem("dashboard"), ...PUBLIC_UTILITY_NAV_ITEMS],
		isOverflowActive: false
	};
	if (activeItem.section === "utility") {
		const visibleItems = [
			getPublicNavItem("explore"),
			getPublicNavItem("reports"),
			activeItem
		];
		return {
			visibleItems,
			overflowItems: PUBLIC_NAV_ITEMS.filter((item) => !visibleItems.some((visible) => visible.id === item.id)),
			isOverflowActive: false
		};
	}
	return {
		visibleItems: mobilePrimaryNavItems,
		overflowItems: [getPublicNavItem("home"), ...PUBLIC_UTILITY_NAV_ITEMS],
		isOverflowActive: false
	};
}
function renderNavLink(item, isActive, sourceRole) {
	return /* @__PURE__ */ jsx(TrackedLink, {
		href: item.href,
		navigationEvent: {
			source: "public_section_nav",
			destination: item.id,
			module: `public_nav_${item.section}`,
			sourceRole,
			destinationRole: item.trackingRole,
			transitionKind: item.trackingRole === "dashboard" ? "to_dashboard" : "within_public"
		},
		"aria-current": isActive ? "page" : void 0,
		className: `inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
		children: item.label
	}, item.id);
}
function PublicSectionNav({ activeItemId, className }) {
	const activeItem = getPublicNavItem(activeItemId);
	const mobileCompactNav = getMobileCompactNav(activeItemId);
	return /* @__PURE__ */ jsxs("nav", {
		"aria-label": "Secciones globales",
		className,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hidden items-center justify-between gap-3 md:flex",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2",
				children: PUBLIC_PRIMARY_NAV_ITEMS.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
			}), /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2",
				children: PUBLIC_UTILITY_NAV_ITEMS.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2 md:hidden",
			children: [mobileCompactNav.visibleItems.slice(0, MOBILE_COMPACT_NAV_LIMIT).map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)), /* @__PURE__ */ jsx(Accordion, {
				className: "relative",
				children: /* @__PURE__ */ jsxs(AccordionItem, {
					value: "mobile-overflow",
					className: "border-none bg-transparent",
					children: [/* @__PURE__ */ jsx(AccordionTrigger, {
						className: `inline-flex cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs font-semibold transition ${mobileCompactNav.isOverflowActive ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`,
						children: "Mas"
					}), /* @__PURE__ */ jsx(AccordionContent, {
						keepMounted: true,
						className: "absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-soft)]",
						children: /* @__PURE__ */ jsx("div", {
							className: "flex flex-col gap-2",
							children: mobileCompactNav.overflowItems.map((item) => renderNavLink(item, item.id === activeItemId, activeItem.trackingRole))
						})
					})]
				})
			})]
		})]
	});
}
//#endregion
export { PublicSectionNav as t };

//# sourceMappingURL=PublicSectionNav-Yd_6xRYh.js.map