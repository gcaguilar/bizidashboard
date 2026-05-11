import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/lib/utils.ts
function cn(...values) {
	return values.filter(Boolean).join(" ");
}
var init_utils = __esmMin((() => {}));
//#endregion
//#region src/components/ui/badge.tsx
var BADGE_VARIANT_CLASSES, Badge;
var init_badge = __esmMin((() => {
	init_utils();
	BADGE_VARIANT_CLASSES = {
		default: "border-[var(--primary)]/35 bg-[var(--primary)]/10 text-[var(--primary)]",
		muted: "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]",
		success: "border-[var(--success)]/40 bg-[var(--success)]/12 text-[var(--success)]",
		warning: "border-[var(--warning)]/40 bg-[var(--warning)]/12 text-[var(--warning)]",
		danger: "border-[var(--danger)]/40 bg-[var(--danger)]/12 text-[var(--danger)]"
	};
	Badge = React.forwardRef(function Badge({ className, variant = "default", ...props }, ref) {
		return /* @__PURE__ */ jsx("span", {
			ref,
			className: cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.09em]", BADGE_VARIANT_CLASSES[variant], className),
			...props
		});
	});
})), CARD_VARIANT_CLASSES, CARD_DATA_VARIANT, Card;
var init_card = __esmMin((() => {
	init_utils();
	CARD_VARIANT_CLASSES = {
		default: "gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-md)]",
		stat: "gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-3",
		panel: "gap-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-[var(--shadow-md)]",
		hero: "ui-page-hero",
		section: "ui-section-card",
		metric: "ui-metric-card",
		"hero-card": "ui-page-hero",
		"dashboard-card": "ui-section-card",
		"stat-card": "ui-metric-card",
		"ui-page-hero": "ui-page-hero",
		"ui-section-card": "ui-section-card",
		"ui-metric-card": "ui-metric-card"
	};
	CARD_DATA_VARIANT = {
		default: "default",
		stat: "stat",
		panel: "panel",
		hero: "hero",
		section: "section",
		metric: "metric",
		"hero-card": "hero",
		"dashboard-card": "section",
		"stat-card": "metric",
		"ui-page-hero": "hero",
		"ui-section-card": "section",
		"ui-metric-card": "metric"
	};
	Card = React.forwardRef(function Card({ className, variant = "default", ...props }, ref) {
		return /* @__PURE__ */ jsx("div", {
			ref,
			"data-card-variant": CARD_DATA_VARIANT[variant],
			className: cn("flex min-w-0 flex-col backdrop-blur-[9px]", CARD_VARIANT_CLASSES[variant], className),
			...props
		});
	});
	React.forwardRef(function HeroCard({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Card, {
			ref,
			variant: "hero",
			className,
			...props
		});
	});
	React.forwardRef(function DashboardCard({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Card, {
			ref,
			variant: "section",
			className,
			...props
		});
	});
	React.forwardRef(function StatCard({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx(Card, {
			ref,
			variant: "metric",
			className,
			...props
		});
	});
	React.forwardRef(function CardHeader({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("div", {
			ref,
			className: cn("flex flex-col gap-1.5", className),
			...props
		});
	});
	React.forwardRef(function CardTitle({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("h3", {
			ref,
			className: cn("text-base font-semibold leading-tight text-[var(--foreground)]", className),
			...props
		});
	});
	React.forwardRef(function CardDescription({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("p", {
			ref,
			className: cn("text-sm leading-relaxed text-[var(--muted)]", className),
			...props
		});
	});
	React.forwardRef(function CardContent({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("div", {
			ref,
			className: cn("space-y-3", className),
			...props
		});
	});
	React.forwardRef(function CardFooter({ className, ...props }, ref) {
		return /* @__PURE__ */ jsx("div", {
			ref,
			className: cn("mt-auto flex items-center gap-2", className),
			...props
		});
	});
}));
//#endregion
export { cn as a, init_badge as i, init_card as n, init_utils as o, Badge as r, Card as t };
