import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
import { a as cn, o as init_utils } from "./card-BqIrN6Ld.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
//#region src/lib/data-state.ts
function normalizeCount(value) {
	return Number.isFinite(value) ? Number(value) : 0;
}
function hasCoverageData(coverage) {
	if (!coverage) return false;
	return normalizeCount(coverage.totalDays) > 0 || normalizeCount(coverage.totalSamples) > 0;
}
function isDataStateStale(status) {
	if (!status) return false;
	return !status.quality.freshness.isFresh;
}
function resolveDataState({ isLoading = false, error = null, hasCoverage = true, hasData = true, isPartial = false, isStale = false }) {
	if (isLoading) return "loading";
	if (error) return "error";
	if (!hasCoverage) return "no_coverage";
	if (!hasData) return "empty";
	if (isStale) return "stale";
	if (isPartial) return "partial";
	return "ok";
}
function combineDataStates(states) {
	const normalized = states.filter(Boolean);
	if (normalized.length === 0) return "empty";
	if (normalized.includes("error")) return "error";
	if (normalized.includes("loading")) return "loading";
	if (normalized.every((state) => state === "no_coverage")) return "no_coverage";
	if (normalized.every((state) => state === "empty" || state === "no_coverage")) return normalized.includes("empty") ? "empty" : "no_coverage";
	if (normalized.includes("stale")) return "stale";
	if (normalized.includes("partial")) return "partial";
	if (normalized.includes("empty") || normalized.includes("no_coverage")) return "partial";
	return "ok";
}
function resolveStatusDataState(status) {
	const recentStations = normalizeCount(status.quality.volume.recentStationCount);
	const totalRows = normalizeCount(status.pipeline.totalRowsCollected);
	return resolveDataState({
		hasCoverage: recentStations > 0 || totalRows > 0 || Boolean(status.quality.freshness.lastUpdated),
		hasData: recentStations > 0 || totalRows > 0 || Boolean(status.quality.freshness.lastUpdated),
		isPartial: recentStations > 0 && recentStations < normalizeCount(status.quality.volume.expectedRange.min),
		isStale: isDataStateStale(status)
	});
}
function resolveDatasetDataState(input) {
	const coverage = input.coverage ?? null;
	return resolveDataState({
		hasCoverage: hasCoverageData(coverage),
		hasData: hasCoverageData(coverage) || Boolean(input.status?.quality.freshness.lastUpdated),
		isPartial: hasCoverageData(coverage) && normalizeCount(coverage?.totalDays) > 0 && normalizeCount(coverage?.totalDays) < 30,
		isStale: isDataStateStale(input.status)
	});
}
function resolveStationsDataState({ count, coverage, status }) {
	const normalizedCount = normalizeCount(count);
	return resolveDataState({
		hasCoverage: normalizedCount > 0 || hasCoverageData(coverage),
		hasData: normalizedCount > 0,
		isPartial: normalizedCount > 0 && Boolean(status) && normalizedCount < normalizeCount(status?.quality.volume.expectedRange.min),
		isStale: normalizedCount > 0 && isDataStateStale(status)
	});
}
function resolveRankingsDataState({ count, coverage, status, requestedLimit }) {
	const normalizedCount = normalizeCount(count);
	const normalizedLimit = normalizeCount(requestedLimit);
	return resolveDataState({
		hasCoverage: normalizedCount > 0 || hasCoverageData(coverage),
		hasData: normalizedCount > 0,
		isPartial: normalizedCount > 0 && normalizedLimit > 0 && normalizedCount < normalizedLimit && normalizeCount(coverage?.totalDays) > 0,
		isStale: normalizedCount > 0 && isDataStateStale(status)
	});
}
function resolveHistoryDataState({ count, coverage, status, expectedDays }) {
	const normalizedCount = normalizeCount(count);
	const normalizedExpectedDays = normalizeCount(expectedDays);
	return resolveDataState({
		hasCoverage: hasCoverageData(coverage),
		hasData: normalizedCount > 0,
		isPartial: normalizedCount > 0 && (normalizedExpectedDays > 0 && normalizedCount < normalizedExpectedDays || normalizeCount(coverage?.totalDays) > normalizedCount),
		isStale: normalizedCount > 0 && isDataStateStale(status)
	});
}
function resolveMobilityDataState({ dailyDemandCount, hourlySignalCount, requestedDemandDays, coverage, status }) {
	const normalizedDemandCount = normalizeCount(dailyDemandCount);
	const normalizedHourlyCount = normalizeCount(hourlySignalCount);
	const hasData = normalizedDemandCount > 0 || normalizedHourlyCount > 0;
	return resolveDataState({
		hasCoverage: hasData || hasCoverageData(coverage),
		hasData,
		isPartial: normalizedDemandCount > 0 && normalizeCount(requestedDemandDays) > 0 && normalizedDemandCount < normalizeCount(requestedDemandDays),
		isStale: hasData && isDataStateStale(status)
	});
}
function shouldShowDataStateNotice(state) {
	return state !== "ok";
}
function getDataStateMeta(state, options = {}) {
	const subject = options.subject ?? "los datos";
	switch (state) {
		case "loading": return {
			state,
			label: "Cargando",
			title: "Cargando datos",
			description: options.loadingDescription ?? `Estamos cargando ${subject}.`,
			toneClasses: "border-sky-500/30 bg-sky-500/10 text-sky-100",
			badgeClasses: "border-sky-500/30 bg-sky-500/15 text-sky-100"
		};
		case "empty": return {
			state,
			label: "Sin datos",
			title: "Sin resultados",
			description: options.emptyDescription ?? `No hay resultados disponibles para ${subject}.`,
			toneClasses: "border-slate-400/25 bg-slate-400/10 text-slate-100",
			badgeClasses: "border-slate-400/25 bg-slate-400/15 text-slate-100"
		};
		case "no_coverage": return {
			state,
			label: "Sin cobertura",
			title: "Cobertura no disponible",
			description: options.noCoverageDescription ?? `Todavia no existe cobertura suficiente para ${subject}.`,
			toneClasses: "border-slate-400/25 bg-slate-400/10 text-slate-100",
			badgeClasses: "border-slate-400/25 bg-slate-400/15 text-slate-100"
		};
		case "partial": return {
			state,
			label: "Dataset parcial",
			title: "Cobertura parcial",
			description: options.partialDescription ?? `Hay datos para ${subject}, pero la ventana disponible es parcial.`,
			toneClasses: "border-amber-400/30 bg-amber-400/10 text-amber-100",
			badgeClasses: "border-amber-400/30 bg-amber-400/15 text-amber-100"
		};
		case "stale": return {
			state,
			label: "Dataset antiguo",
			title: "Datos desactualizados",
			description: options.staleDescription ?? `Los datos disponibles para ${subject} no estan frescos y pueden haber quedado antiguos.`,
			toneClasses: "border-orange-400/30 bg-orange-400/10 text-orange-100",
			badgeClasses: "border-orange-400/30 bg-orange-400/15 text-orange-100"
		};
		case "error": return {
			state,
			label: "Error",
			title: "Error cargando datos",
			description: options.errorDescription ?? `No se pudieron cargar ${subject} ahora mismo.`,
			toneClasses: "border-rose-500/30 bg-rose-500/10 text-rose-100",
			badgeClasses: "border-rose-500/30 bg-rose-500/15 text-rose-100"
		};
		default: return {
			state: "ok",
			label: "OK",
			title: "Datos listos",
			description: options.okDescription ?? `${subject} estan listos y consistentes.`,
			toneClasses: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
			badgeClasses: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
		};
	}
}
//#endregion
//#region src/components/ui/slot.tsx
var Slot;
var init_slot = __esmMin((() => {
	init_utils();
	Slot = React.forwardRef(function Slot({ children, className, ...props }, _forwardedRef) {
		const child = React.Children.only(children);
		const childProps = child.props;
		return React.cloneElement(child, {
			...props,
			...childProps,
			className: cn(className, childProps.className)
		});
	});
}));
//#endregion
//#region src/components/ui/button.tsx
function buttonVariants({ variant = "default", size = "default", className } = {}) {
	const baseClasses = variant === "icon-button" ? "inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-60" : "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition outline-none disabled:pointer-events-none disabled:opacity-60";
	const sizeClasses = variant === "icon-button" && size === "default" ? "" : BUTTON_SIZE_CLASSES[size];
	return cn(baseClasses, BUTTON_VARIANT_CLASSES[variant], sizeClasses, className);
}
var BUTTON_VARIANT_CLASSES, BUTTON_SIZE_CLASSES, Button;
var init_button = __esmMin((() => {
	init_utils();
	init_slot();
	BUTTON_VARIANT_CLASSES = {
		default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-strong)]",
		outline: "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--card)]",
		ghost: "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]",
		chip: "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]",
		"icon-button": "min-h-10 min-w-10 rounded-[0.65rem] border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-[0.78rem] font-bold text-[var(--primary-strong)] transition hover:-translate-y-px hover:border-[var(--primary-soft)] hover:bg-[color-mix(in_srgb,var(--primary)_16%,var(--secondary))] hover:text-white active:translate-y-0",
		cta: "border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
	};
	BUTTON_SIZE_CLASSES = {
		default: "min-h-10 px-4 py-2 text-sm",
		sm: "min-h-8 px-3 py-1.5 text-xs",
		icon: "h-10 w-10 p-0 text-sm"
	};
	Button = React.forwardRef(function Button({ className, variant = "default", size = "default", type = "button", asChild = false, children, ...props }, ref) {
		const classes = buttonVariants({
			variant,
			size,
			className
		});
		if (asChild) return /* @__PURE__ */ jsx(Slot, {
			ref,
			"data-button-variant": variant,
			className: classes,
			...props,
			children
		});
		return /* @__PURE__ */ jsx("button", {
			ref,
			type,
			"data-button-variant": variant,
			className: classes,
			...props,
			children
		});
	});
	React.forwardRef(function IconButton({ className, size = "default", ...props }, ref) {
		return /* @__PURE__ */ jsx(Button, {
			ref,
			variant: "icon-button",
			size,
			className,
			...props
		});
	});
}));
//#endregion
export { getDataStateMeta as a, resolveHistoryDataState as c, resolveStationsDataState as d, resolveStatusDataState as f, combineDataStates as i, resolveMobilityDataState as l, buttonVariants as n, resolveDataState as o, shouldShowDataStateNotice as p, init_button as r, resolveDatasetDataState as s, Button as t, resolveRankingsDataState as u };
