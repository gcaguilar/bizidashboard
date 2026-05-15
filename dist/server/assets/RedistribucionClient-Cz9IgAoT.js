import { t as PageShell } from "./page-shell-DP1spWfk.js";
import { a as buildExportClickEvent, l as buildPanelOpenEvent, o as buildFilterChangeEvent, p as trackUmamiEvent } from "./umami-BYNhNb0r.js";
import { i as AccordionTrigger, n as AccordionContent, r as AccordionItem, t as Accordion } from "./accordion-Cl6-ndDy.js";
import { r as appRoutes } from "./routes-CFkMZBCM.js";
import { a as Badge, t as Card } from "./card-BX20N-Ev.js";
import { t as Button } from "./button-Bgvi3bSh.js";
import { t as captureExceptionWithContext } from "./sentry-reporting-6fzVQr1k.js";
import { a as Checkbox, i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-KaqJfHCb.js";
import { a as ScrollArea, i as TrackedAnchor, o as DashboardPageViewTracker, s as Input, t as Alert } from "./alert-BmvSL5Kt.js";
import { a as TableHeader, c as SelectContent, d as SelectTrigger, f as SelectValue, i as TableHead, l as SelectIcon, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectItem } from "./table-Fvifybs5.js";
import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
//#region src/app/dashboard/redistribucion/_components/ClassificationLegend.tsx
var CLASSIFICATIONS = [
	{
		code: "overstock",
		label: "A — Sobrestock",
		color: "text-orange-700 dark:text-orange-400",
		bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
		description: "Ocupacion alta sostenida, baja rotación e inmóvil. Bicis \"paradas\". Candidata a donar."
	},
	{
		code: "deficit",
		label: "B — Déficit",
		color: "text-red-700 dark:text-red-400",
		bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
		description: "Ocupacion baja crónica, alta presión de salida. Necesita más stock base."
	},
	{
		code: "peak_saturation",
		label: "C — Saturación puntual",
		color: "text-amber-700 dark:text-amber-400",
		bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
		description: "Solo se llena en franjas concretas. Fuera de esas horas, vuelve a la normalidad."
	},
	{
		code: "peak_emptying",
		label: "D — Vaciado puntual",
		color: "text-yellow-700 dark:text-yellow-400",
		bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
		description: "Solo se vacía en hora punta. Se recupera después sin intervención."
	},
	{
		code: "balanced",
		label: "E — Equilibrada",
		color: "text-green-700 dark:text-green-400",
		bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
		description: "Fluctúa dentro de banda objetivo. No requiere intervención activa."
	},
	{
		code: "data_review",
		label: "F — Revisar dato",
		color: "text-slate-600 dark:text-slate-400",
		bg: "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700",
		description: "Dato anómalo o sensor sospechoso. Excluida de decisiones logísticas hasta validar."
	}
];
function ClassificationLegend() {
	return /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsxs(Card, {
		className: "p-4",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
			children: "Clasificación de estaciones"
		}), /* @__PURE__ */ jsx("div", {
			className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
			children: CLASSIFICATIONS.map((c) => /* @__PURE__ */ jsxs(Card, {
				variant: "stat",
				className: `gap-2 rounded-lg border p-3 text-sm ${c.bg}`,
				children: [/* @__PURE__ */ jsx(Badge, {
					variant: "muted",
					className: `w-fit border-transparent px-0 py-0 text-xs font-semibold normal-case tracking-normal ${c.color}`,
					children: c.label
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-[var(--muted)]",
					children: c.description
				})]
			}, c.code))
		})]
	}) });
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/RebalancingSummaryCards.tsx
function RebalancingSummaryCards({ summary }) {
	return /* @__PURE__ */ jsx("div", {
		className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
		children: [
			{
				label: "Donantes",
				value: (summary.byAction.donor ?? 0) + (summary.byAction.peak_remove ?? 0),
				color: "text-orange-600 dark:text-orange-400",
				description: "tienen exceso de bicis"
			},
			{
				label: "Receptoras",
				value: (summary.byAction.receptor ?? 0) + (summary.byAction.peak_fill ?? 0),
				color: "text-red-600 dark:text-red-400",
				description: "necesitan bicis"
			},
			{
				label: "Urgencia alta",
				value: summary.criticalUrgencyCount + summary.highUrgencyCount,
				color: "text-rose-600 dark:text-rose-400",
				description: "requieren atención prioritaria"
			},
			{
				label: "Transferencias",
				value: summary.stationsWithTransfer,
				color: "text-sky-600 dark:text-sky-400",
				description: "movimientos sugeridos"
			},
			{
				label: "Equilibradas",
				value: summary.byAction.stable ?? 0,
				color: "text-green-600 dark:text-green-400",
				description: "sin intervención necesaria"
			},
			{
				label: "A revisar",
				value: summary.byAction.review ?? 0,
				color: "text-slate-500 dark:text-slate-400",
				description: "dato anómalo, excluidas"
			}
		].map((card) => /* @__PURE__ */ jsxs(Card, {
			variant: "stat",
			className: "gap-1 px-4 py-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: `text-3xl font-black tabular-nums ${card.color}`,
					children: card.value
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs font-semibold text-[var(--foreground)]",
					children: card.label
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-[var(--muted)]",
					children: card.description
				})
			]
		}, card.label))
	});
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/RebalancingTable.tsx
var PAGE_SIZE = 20;
var SELECT_ALL_VALUE = "__all__";
var COLUMN_VISIBILITY_LABELS = {
	select: "☑",
	stationName: "Estación",
	districtName: "Barrio",
	inferredType: "Tipo",
	classification: "Clasificación",
	currentOccupancy: "Ocupación",
	actionGroup: "Acción",
	urgency: "Urgencia",
	priorityScore: "Score",
	expand: "Expand"
};
function copyToClipboard(diagnostics) {
	const text = diagnostics.map((d) => [
		d.stationName,
		d.stationId,
		d.districtName ?? "",
		d.inferredType,
		CLASSIFICATION_LABEL[d.classification],
		`${Math.round(d.currentOccupancy * 100)}%`,
		ACTION_LABEL[d.actionGroup],
		URGENCY_LABEL[d.urgency]
	].join("	")).join("\n");
	navigator.clipboard.writeText(text);
}
function exportToCSV(diagnostics, filename) {
	const csvContent = [[
		"Estación",
		"ID",
		"Barrio",
		"Tipo",
		"Clasificación",
		"Ocupación",
		"Banda",
		"Acción",
		"Urgencia",
		"Score"
	], ...diagnostics.map((d) => [
		d.stationName,
		d.stationId,
		d.districtName ?? "",
		d.inferredType,
		CLASSIFICATION_LABEL[d.classification],
		`${Math.round(d.currentOccupancy * 100)}%`,
		`${Math.round(d.targetBand.min * 100)}%-${Math.round(d.targetBand.max * 100)}%`,
		ACTION_LABEL[d.actionGroup],
		URGENCY_LABEL[d.urgency],
		Math.round(d.priorityScore * 100).toString()
	])].map((row) => row.map((cell) => `"${cell.replace(/"/g, "\"\"")}"`).join(",")).join("\n");
	const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
var CLASSIFICATION_STYLE = {
	overstock: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
	deficit: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
	peak_saturation: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
	peak_emptying: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
	balanced: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
	data_review: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
};
var CLASSIFICATION_LABEL = {
	overstock: "A Sobrestock",
	deficit: "B Déficit",
	peak_saturation: "C Sat. punta",
	peak_emptying: "D Vaciado punta",
	balanced: "E Equilibrada",
	data_review: "F Revisar dato"
};
var ACTION_LABEL = {
	donor: "Donar",
	receptor: "Recibir",
	peak_remove: "Retirar (prev.)",
	peak_fill: "Reponer (prev.)",
	stable: "No actuar",
	review: "Revisar"
};
var URGENCY_STYLE = {
	critical: "text-rose-600 dark:text-rose-400 font-bold",
	high: "text-red-600 dark:text-red-400 font-semibold",
	medium: "text-amber-600 dark:text-amber-400",
	low: "text-slate-500",
	none: "text-slate-400"
};
var URGENCY_LABEL = {
	critical: "Crítica",
	high: "Alta",
	medium: "Media",
	low: "Baja",
	none: "—"
};
var CLASSIFICATION_OPTIONS = [{
	value: "",
	label: "Todas"
}, ...Object.entries(CLASSIFICATION_LABEL).map(([value, label]) => ({
	value,
	label
}))];
var ACTION_OPTIONS = [{
	value: "",
	label: "Todas"
}, ...Object.entries(ACTION_LABEL).map(([value, label]) => ({
	value,
	label
}))];
var URGENCY_OPTIONS = [{
	value: "",
	label: "Todas"
}, ...Object.entries(URGENCY_LABEL).map(([value, label]) => ({
	value,
	label
}))];
var QUICK_FILTERS = [
	{
		id: "all",
		label: "Todas",
		filter: null
	},
	{
		id: "donors",
		label: "Donantes",
		filter: {
			id: "actionGroup",
			value: "donor"
		}
	},
	{
		id: "receptors",
		label: "Receptoras",
		filter: {
			id: "actionGroup",
			value: "receptor"
		}
	},
	{
		id: "critical",
		label: "Críticas",
		filter: {
			id: "urgency",
			value: "critical"
		}
	},
	{
		id: "high",
		label: "Altas",
		filter: {
			id: "urgency",
			value: "high"
		}
	},
	{
		id: "review",
		label: "Revisar",
		filter: {
			id: "actionGroup",
			value: "review"
		}
	}
];
function OccupancyBar({ occupancy, bandMin, bandMax }) {
	const pct = Math.round(occupancy * 100);
	const barColor = occupancy >= bandMin && occupancy <= bandMax ? "bg-green-500" : occupancy < bandMin ? "bg-red-500" : "bg-orange-500";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative h-2 w-20 rounded-full bg-[var(--border)]",
			children: [/* @__PURE__ */ jsx("div", {
				className: "absolute top-0 h-full rounded-full bg-green-200 dark:bg-green-900/50",
				style: {
					left: `${bandMin * 100}%`,
					width: `${(bandMax - bandMin) * 100}%`
				}
			}), /* @__PURE__ */ jsx("div", {
				className: `absolute top-0 h-full w-1 rounded-full ${barColor}`,
				style: { left: `${Math.min(99, pct)}%` }
			})]
		}), /* @__PURE__ */ jsxs("span", {
			className: "tabular-nums text-xs",
			children: [pct, "%"]
		})]
	});
}
var columns = [
	{
		id: "select",
		header: ({ table }) => /* @__PURE__ */ jsx(Checkbox, {
			checked: table.getIsAllRowsSelected(),
			onChange: table.getToggleAllRowsSelectedHandler(),
			"aria-label": "Seleccionar todas las filas"
		}),
		cell: ({ row }) => /* @__PURE__ */ jsx(Checkbox, {
			checked: row.getIsSelected(),
			onChange: row.getToggleSelectedHandler(),
			"aria-label": `Seleccionar estación ${row.original.stationName}`,
			onClick: (e) => e.stopPropagation()
		}),
		size: 40,
		enableSorting: false
	},
	{
		accessorKey: "stationName",
		header: "Estación",
		cell: ({ row }) => /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("p", {
			className: "font-medium text-[var(--foreground)]",
			children: row.original.stationName
		}), /* @__PURE__ */ jsxs("p", {
			className: "text-xs text-[var(--muted)]",
			children: ["#", row.original.stationId]
		})] })
	},
	{
		accessorKey: "districtName",
		header: "Barrio",
		cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
			className: "text-xs text-[var(--muted)]",
			children: getValue() ?? "—"
		})
	},
	{
		id: "inferredType",
		header: "Tipo",
		cell: ({ row }) => /* @__PURE__ */ jsx("span", {
			className: "text-xs text-[var(--muted)] capitalize",
			children: row.original.inferredType
		})
	},
	{
		accessorKey: "classification",
		header: "Clasificación",
		cell: ({ getValue }) => {
			const value = getValue();
			return /* @__PURE__ */ jsx("span", {
				className: `inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[value]}`,
				children: CLASSIFICATION_LABEL[value]
			});
		}
	},
	{
		accessorKey: "currentOccupancy",
		header: "Ocupación / Banda",
		cell: ({ row }) => /* @__PURE__ */ jsx(OccupancyBar, {
			occupancy: row.original.currentOccupancy,
			bandMin: row.original.targetBand.min,
			bandMax: row.original.targetBand.max
		})
	},
	{
		accessorKey: "actionGroup",
		header: "Acción",
		cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
			className: "text-xs font-medium text-[var(--foreground)]",
			children: ACTION_LABEL[getValue()]
		})
	},
	{
		accessorKey: "urgency",
		header: "Urgencia",
		cell: ({ getValue }) => {
			const value = getValue();
			return /* @__PURE__ */ jsx("span", {
				className: `text-xs ${URGENCY_STYLE[value]}`,
				children: URGENCY_LABEL[value]
			});
		}
	},
	{
		accessorKey: "priorityScore",
		header: "Score",
		cell: ({ getValue }) => /* @__PURE__ */ jsx("span", {
			className: "text-xs tabular-nums text-[var(--muted)]",
			children: (getValue() * 100).toFixed(0)
		})
	},
	{
		id: "expand",
		header: "",
		cell: () => /* @__PURE__ */ jsx("span", { className: "text-xs text-[var(--muted)]" })
	}
];
function FilterSelect({ value, onChange, options, ariaLabel }) {
	return /* @__PURE__ */ jsxs(Select, {
		value: value || SELECT_ALL_VALUE,
		onValueChange: (nextValue) => onChange(nextValue && nextValue !== SELECT_ALL_VALUE ? nextValue : ""),
		children: [/* @__PURE__ */ jsxs(SelectTrigger, {
			"aria-label": ariaLabel,
			className: "h-8 min-h-8 rounded-md px-2 py-0 text-xs",
			children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
		}), /* @__PURE__ */ jsx(SelectContent, { children: options.map((opt) => /* @__PURE__ */ jsx(SelectItem, {
			value: opt.value || SELECT_ALL_VALUE,
			children: opt.label
		}, opt.value || SELECT_ALL_VALUE)) })]
	});
}
function RebalancingTable({ diagnostics, initialParams }) {
	const [sorting, setSorting] = useState(() => {
		if (initialParams?.sort) {
			const [id, desc] = initialParams.sort.split(":");
			return [{
				id,
				desc: desc === "desc"
			}];
		}
		return [{
			id: "priorityScore",
			desc: true
		}];
	});
	const [columnFilters, setColumnFilters] = useState(() => {
		if (initialParams?.filter) {
			const [id, value] = initialParams.filter.split(":");
			return [{
				id,
				value
			}];
		}
		return [];
	});
	const [globalFilter, setGlobalFilter] = useState(initialParams?.search ?? "");
	const [expandedId, setExpandedId] = useState(null);
	const [pagination, setPagination] = useState({
		pageIndex: initialParams?.page ?? 0,
		pageSize: initialParams?.pageSize ?? PAGE_SIZE
	});
	const [columnVisibility, setColumnVisibility] = useState({
		select: true,
		stationName: true,
		districtName: true,
		inferredType: true,
		classification: true,
		currentOccupancy: true,
		actionGroup: true,
		urgency: true,
		priorityScore: true,
		expand: true
	});
	const [rowSelection, setRowSelection] = useState({});
	const [activeQuickFilter, setActiveQuickFilter] = useState("all");
	const [openToolbarAccordions, setOpenToolbarAccordions] = useState([]);
	const handleToggle = useCallback((stationId) => {
		setExpandedId((id) => id === stationId ? null : stationId);
	}, []);
	const handleKeyDown = useCallback((e, stationId) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleToggle(stationId);
		}
	}, [handleToggle]);
	const handleHeaderClick = useCallback((e, column) => {
		if (!column.getCanSort()) return;
		if (e.shiftKey && sorting.length > 0) if (sorting.find((s) => s.id === column.id)) setSorting((prev) => prev.map((s) => s.id === column.id ? {
			...s,
			desc: !s.desc
		} : s));
		else setSorting((prev) => [...prev, {
			id: column.id,
			desc: true
		}]);
		else column.toggleSorting();
	}, [sorting]);
	const updateURL = useCallback(() => {
		const params = new URLSearchParams();
		if (sorting.length > 0) params.set("sort", `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`);
		if (globalFilter) params.set("search", globalFilter);
		if (columnFilters.length > 0) params.set("filter", `${columnFilters[0].id}:${columnFilters[0].value}`);
		if (pagination.pageIndex > 0) params.set("page", String(pagination.pageIndex));
		if (pagination.pageSize !== PAGE_SIZE) params.set("pageSize", String(pagination.pageSize));
		const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
		window.history.replaceState(null, "", url);
	}, [
		sorting,
		globalFilter,
		columnFilters,
		pagination
	]);
	useEffect(() => {
		updateURL();
	}, [updateURL]);
	const table = useReactTable({
		data: diagnostics,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			pagination,
			columnVisibility,
			rowSelection
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowId: (row) => row.stationId,
		enableMultiSort: true
	});
	const totalRows = table.getFilteredRowModel().rows.length;
	const pageCount = table.getPageCount();
	const pageIndex = pagination.pageIndex;
	const pageSize = pagination.pageSize;
	const selectedCount = Object.keys(rowSelection).length;
	const applyQuickFilter = useCallback((filterId) => {
		setActiveQuickFilter(filterId);
		const qf = QUICK_FILTERS.find((f) => f.id === filterId);
		if (!qf || !qf.filter) setColumnFilters([]);
		else setColumnFilters([qf.filter]);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ jsx(Input, {
							placeholder: "Buscar estación o barrio...",
							value: globalFilter,
							onChange: (e) => setGlobalFilter(e.target.value),
							"aria-label": "Buscar estación o barrio",
							className: "h-8 min-h-8 w-40 rounded-md bg-[var(--background)] px-3 text-xs"
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-1",
						children: QUICK_FILTERS.map((qf) => /* @__PURE__ */ jsx(Button, {
							onClick: () => applyQuickFilter(qf.id),
							variant: activeQuickFilter === qf.id ? "default" : "chip",
							size: "sm",
							className: `min-h-7 rounded px-2 py-1 text-xs ${activeQuickFilter === qf.id ? "border-[var(--primary)]" : "text-[var(--foreground)]"}`,
							children: qf.label
						}, qf.id))
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "classification")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "classification"), ...value ? [{
							id: "classification",
							value
						}] : []]),
						options: CLASSIFICATION_OPTIONS,
						ariaLabel: "Filtrar por clasificación"
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "actionGroup")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "actionGroup"), ...value ? [{
							id: "actionGroup",
							value
						}] : []]),
						options: ACTION_OPTIONS,
						ariaLabel: "Filtrar por acción"
					}),
					/* @__PURE__ */ jsx(FilterSelect, {
						value: columnFilters.find((f) => f.id === "urgency")?.value ?? "",
						onChange: (value) => setColumnFilters((prev) => [...prev.filter((f) => f.id !== "urgency"), ...value ? [{
							id: "urgency",
							value
						}] : []]),
						options: URGENCY_OPTIONS,
						ariaLabel: "Filtrar por urgencia"
					}),
					(globalFilter || columnFilters.length > 0) && /* @__PURE__ */ jsx(Button, {
						onClick: () => {
							setGlobalFilter("");
							setColumnFilters([]);
							setActiveQuickFilter("all");
						},
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: "Limpiar filtros"
					}),
					/* @__PURE__ */ jsx(Accordion, {
						value: openToolbarAccordions,
						onValueChange: setOpenToolbarAccordions,
						className: "w-full sm:w-auto",
						children: /* @__PURE__ */ jsxs(AccordionItem, {
							value: "columns",
							className: "rounded-md border border-[var(--border)] bg-[var(--card)]",
							children: [/* @__PURE__ */ jsx(AccordionTrigger, {
								className: "px-2 py-1.5 text-xs text-[var(--primary)] [&>span]:text-xs [&>span]:font-semibold",
								children: "Columnas"
							}), /* @__PURE__ */ jsx(AccordionContent, {
								className: "space-y-1 border-none p-2 text-xs",
								children: table.getAllLeafColumns().map((column) => /* @__PURE__ */ jsxs("label", {
									className: "flex items-center gap-2 whitespace-nowrap text-xs text-[var(--foreground)]",
									children: [/* @__PURE__ */ jsx(Checkbox, {
										checked: column.getIsVisible(),
										onChange: () => column.toggleVisibility(),
										"aria-label": `Mostrar columna ${COLUMN_VISIBILITY_LABELS[column.id] ?? column.id}`
									}), COLUMN_VISIBILITY_LABELS[column.id] ?? column.id]
								}, column.id))
							})]
						})
					}),
					totalRows > 0 && /* @__PURE__ */ jsx(Button, {
						onClick: () => {
							copyToClipboard(selectedCount > 0 ? table.getSelectedRowModel().rows.map((r) => r.original) : table.getFilteredRowModel().rows.map((r) => r.original));
						},
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: selectedCount > 0 ? `Copiar ${selectedCount}` : "Copiar"
					}),
					totalRows > 0 && /* @__PURE__ */ jsx(Button, {
						onClick: () => exportToCSV(table.getFilteredRowModel().rows.map((r) => r.original), "estaciones-redistribucion"),
						variant: "ghost",
						size: "sm",
						className: "min-h-7 px-1 text-xs text-[var(--primary)] hover:underline",
						children: "Exportar CSV"
					}),
					selectedCount > 0 && /* @__PURE__ */ jsxs("span", {
						className: "text-xs text-[var(--muted)]",
						children: [
							selectedCount,
							" seleccionado",
							selectedCount !== 1 ? "s" : ""
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs(ScrollArea, {
				className: "overflow-x-auto rounded-xl border border-[var(--border)] max-w-[100vw]",
				children: [/* @__PURE__ */ jsxs(Table, {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ jsx(TableHeader, {
						className: "sticky top-0 border-b border-[var(--border)] bg-[var(--card)]",
						children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx(TableRow, { children: headerGroup.headers.map((header) => /* @__PURE__ */ jsxs(TableHead, {
							className: `h-auto select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold normal-case tracking-normal text-[var(--muted)] ${header.column.getCanSort() ? "cursor-pointer hover:text-[var(--foreground)]" : ""}`,
							onClick: (e) => handleHeaderClick(e, header.column),
							style: { width: header.getSize() },
							children: [
								header.isPlaceholder ? null : typeof header.column.columnDef.header === "function" ? header.column.columnDef.header(header.getContext()) : header.column.columnDef.header,
								header.column.getIsSorted() === "asc" && " ↑",
								header.column.getIsSorted() === "desc" && " ↓"
							]
						}, header.id)) }, headerGroup.id))
					}), /* @__PURE__ */ jsx(TableBody, {
						className: "divide-y divide-[var(--border)]",
						children: table.getRowModel().rows.map((row) => {
							const isExpanded = expandedId === row.original.stationId;
							const diagnostic = row.original;
							return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(TableRow, {
								className: "cursor-pointer bg-[var(--card)] transition-colors hover:bg-[var(--surface-hover,var(--card))]",
								onClick: () => handleToggle(diagnostic.stationId),
								onKeyDown: (e) => handleKeyDown(e, diagnostic.stationId),
								tabIndex: 0,
								role: "button",
								"aria-expanded": isExpanded,
								children: row.getVisibleCells().map((cell) => {
									const colId = cell.column.id;
									if (colId === "expand") return /* @__PURE__ */ jsx(TableCell, {
										className: "px-3 py-2.5 text-xs text-[var(--muted)]",
										children: isExpanded ? "▲" : "▼"
									}, colId);
									return /* @__PURE__ */ jsx(TableCell, {
										className: "px-3 py-2.5",
										children: typeof cell.column.columnDef.cell === "function" ? cell.column.columnDef.cell(cell.getContext()) : null
									}, colId);
								})
							}), isExpanded && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
								colSpan: 11,
								className: "border-b border-[var(--border)] bg-[var(--surface-secondary,var(--card))] px-4 pb-4 pt-2",
								children: /* @__PURE__ */ jsxs("div", {
									className: "grid gap-4 text-xs sm:grid-cols-2",
									children: [
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Razones de clasificación"
										}), /* @__PURE__ */ jsx("ul", {
											className: "space-y-1 text-[var(--muted)]",
											children: diagnostic.classificationReasons.map((r, i) => /* @__PURE__ */ jsxs("li", {
												className: "flex gap-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "shrink-0 text-[var(--primary)]",
													children: "›"
												}), r]
											}, i))
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Razones de acción"
										}), /* @__PURE__ */ jsx("ul", {
											className: "space-y-1 text-[var(--muted)]",
											children: diagnostic.actionReasons.map((r, i) => /* @__PURE__ */ jsxs("li", {
												className: "flex gap-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "shrink-0 text-[var(--primary)]",
													children: "›"
												}), r]
											}, i))
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Predicción"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-[var(--muted)]",
											children: [
												"Riesgo vacío 1h: ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.riskEmptyAt1h * 100), "%"] }),
												" ",
												"· Riesgo lleno 1h: ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.riskFullAt1h * 100), "%"] }),
												" ",
												"· Autocorrección:",
												" ",
												/* @__PURE__ */ jsxs("strong", { children: [Math.round(diagnostic.risk.selfCorrectionProbability * 100), "%"] }),
												diagnostic.risk.estimatedRecoveryMinutes !== null && ` · Recuperación: ~${diagnostic.risk.estimatedRecoveryMinutes} min`
											]
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "mb-1 font-semibold text-[var(--foreground)]",
											children: "Red cercana"
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-[var(--muted)]",
											children: [
												diagnostic.network.nearbyStations.length,
												" estaciones en radio 500m · Ajuste urgencia:",
												" ",
												Math.round(diagnostic.network.urgencyAdjustment * 100),
												"%"
											]
										})] })
									]
								})
							}) })] }, row.id);
						})
					})]
				}), totalRows === 0 && /* @__PURE__ */ jsx("p", {
					className: "py-8 text-center text-sm text-[var(--muted)]",
					children: "No hay estaciones que mostrar con los filtros actuales."
				})]
			}),
			pageCount > 1 && /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-xs text-[var(--muted)]",
					children: [
						/* @__PURE__ */ jsxs("span", { children: [
							pageIndex * pageSize + 1,
							"-",
							Math.min((pageIndex + 1) * pageSize, totalRows),
							" de ",
							totalRows
						] }),
						/* @__PURE__ */ jsxs(Select, {
							value: String(pageSize),
							onValueChange: (nextValue) => {
								if (!nextValue) return;
								setPagination({
									...pagination,
									pageSize: Number(nextValue),
									pageIndex: 0
								});
							},
							children: [/* @__PURE__ */ jsxs(SelectTrigger, {
								"aria-label": "Filas por página",
								className: "h-7 min-h-7 w-20 rounded-md bg-[var(--background)] px-2 py-0 text-xs",
								children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
							}), /* @__PURE__ */ jsx(SelectContent, { children: [
								10,
								20,
								50,
								100
							].map((size) => /* @__PURE__ */ jsx(SelectItem, {
								value: String(size),
								children: size
							}, size)) })]
						}),
						/* @__PURE__ */ jsx("span", { children: "por página" })
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: 0
							}),
							disabled: pageIndex === 0,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "««"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: Math.max(0, pageIndex - 1)
							}),
							disabled: pageIndex === 0,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "«"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: Math.min(pageCount - 1, pageIndex + 1)
							}),
							disabled: pageIndex >= pageCount - 1,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "»"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: () => setPagination({
								...pagination,
								pageIndex: pageCount - 1
							}),
							disabled: pageIndex >= pageCount - 1,
							variant: "ghost",
							size: "sm",
							className: "h-7 min-h-7 rounded px-2 py-1 text-xs",
							children: "»»"
						})
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/TransferTable.tsx
function TransferTable({ transfers }) {
	if (transfers.length === 0) return /* @__PURE__ */ jsx(Card, {
		className: "p-8 text-center text-sm text-[var(--muted)]",
		children: "No hay transferencias sugeridas en este momento. Las estaciones están dentro de banda o se autocorrigen."
	});
	return /* @__PURE__ */ jsx("div", {
		className: "space-y-3",
		children: transfers.map((t, i) => /* @__PURE__ */ jsxs(Card, {
			className: "p-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 text-sm font-semibold",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-orange-600 dark:text-orange-400",
								children: t.originStationName
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-[var(--muted)]",
								children: "→"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-sky-600 dark:text-sky-400",
								children: t.destinationStationName
							})
						]
					}), /* @__PURE__ */ jsxs(Badge, {
						className: "rounded-full bg-[var(--primary)] px-3 py-1 text-sm font-bold normal-case tracking-normal text-white",
						children: [t.bikesToMove, " bicis"]
					})]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-xs text-[var(--muted)]",
					children: [
						"Ventana horaria: ",
						/* @__PURE__ */ jsxs("strong", { children: [
							t.timeWindow.start,
							"–",
							t.timeWindow.end
						] }),
						" ·",
						" ",
						"Confianza: ",
						Math.round(t.confidence * 100),
						"%"
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex flex-wrap gap-4 text-xs",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Vaciados evitados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-green-600 dark:text-green-400",
							children: [t.expectedImpact.emptiesAvoided.toFixed(1), "h"]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Llenos evitados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-green-600 dark:text-green-400",
							children: [t.expectedImpact.fullsAvoided.toFixed(1), "h"]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Usos recuperados "
						}), /* @__PURE__ */ jsxs("strong", {
							className: "text-sky-600 dark:text-sky-400",
							children: ["~", t.expectedImpact.usesRecovered.toFixed(0)]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-[var(--muted)]",
							children: "Score logístico "
						}), /* @__PURE__ */ jsxs("strong", { children: [Math.round(t.expectedImpact.costScore * 100), "%"] })] })
					]
				}),
				/* @__PURE__ */ jsx(Accordion, {
					className: "mt-3",
					children: /* @__PURE__ */ jsxs(AccordionItem, {
						value: `transfer-reasons-${i}`,
						children: [/* @__PURE__ */ jsx(AccordionTrigger, {
							className: "px-0 py-0 text-xs text-[var(--primary)]",
							children: "Por qué se recomienda esta transferencia"
						}), /* @__PURE__ */ jsx(AccordionContent, {
							className: "mt-2 border-t-0 px-0 py-0",
							children: /* @__PURE__ */ jsx("ul", {
								className: "space-y-1 text-xs text-[var(--muted)]",
								children: t.reasons.map((r, j) => /* @__PURE__ */ jsxs("li", {
									className: "flex gap-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-[var(--primary)]",
										children: "›"
									}), r]
								}, j))
							})
						})]
					})
				})
			]
		}, i))
	});
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/KpiCards.tsx
function pct(v) {
	return `${Math.round(v * 100)}%`;
}
function fmt(v, unit = "") {
	if (v === null) return "—";
	return `${v.toFixed(1)}${unit}`;
}
function KpiCards({ kpis, baseline }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "KPIs de servicio"
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-red-600 dark:text-red-400",
							children: pct(kpis.service.systemPctTimeEmpty)
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "% tiempo vacías (sistema)"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-orange-600 dark:text-orange-400",
							children: pct(kpis.service.systemPctTimeFull)
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "% tiempo llenas (sistema)"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-[var(--foreground)]",
							children: fmt(kpis.service.avgCriticalEpisodeMinutes, " min")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Episodio crítico promedio"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
							className: "text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400",
							children: ["~", kpis.service.estimatedLostUses.toFixed(0)]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Usos perdidos estimados"
						})] })
					]
				})]
			}),
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "Impacto esperado de intervenciones"
				}), /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-green-600 dark:text-green-400",
							children: fmt(kpis.impact.totalEmptiesAvoided, "h")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Horas vacías evitadas"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-green-600 dark:text-green-400",
							children: fmt(kpis.impact.totalFullsAvoided, "h")
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Horas llenas evitadas"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
							className: "text-2xl font-black tabular-nums text-sky-600 dark:text-sky-400",
							children: ["~", kpis.impact.totalUsesRecovered.toFixed(0)]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Usos recuperados"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-2xl font-black tabular-nums text-[var(--foreground)]",
							children: kpis.impact.improvementVsBaselinePct !== null ? `${kpis.impact.improvementVsBaselinePct.toFixed(1)}%` : "—"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-[var(--muted)]",
							children: "Mejora vs sin intervención"
						})] })
					]
				})]
			}),
			/* @__PURE__ */ jsxs(Card, {
				className: "p-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "mb-3 text-sm font-semibold text-[var(--foreground)]",
					children: "Comparativa de escenarios"
				}), /* @__PURE__ */ jsx(ScrollArea, {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs(Table, {
						className: "text-xs",
						children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, {
							className: "text-left text-[var(--muted)]",
							children: [
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Escenario"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Vaciados evitados"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Llenos evitados"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 pr-4 normal-case tracking-normal",
									children: "Movimientos"
								}),
								/* @__PURE__ */ jsx(TableHead, {
									className: "h-auto px-0 pb-2 normal-case tracking-normal",
									children: "Coste / incidente"
								})
							]
						}) }), /* @__PURE__ */ jsx(TableBody, { children: [
							baseline.doNothing,
							baseline.simpleRules,
							baseline.recommended
						].map((s) => /* @__PURE__ */ jsxs(TableRow, {
							className: s.label === "Sistema recomendado" ? "font-semibold" : "",
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4",
									children: s.label
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.emptiesAvoided.toFixed(1)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.fullsAvoided.toFixed(1)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 pr-4 tabular-nums",
									children: s.totalMoves
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "px-0 py-2 tabular-nums",
									children: s.costPerIncidentAvoided !== null ? s.costPerIncidentAvoided.toFixed(2) : "—"
								})
							]
						}, s.label)) })]
					})
				})]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/redistribucion/_components/RedistribucionClient.tsx
var ANALYSIS_WINDOWS = [
	7,
	15,
	30,
	60
];
var ALL_DISTRICTS_VALUE = "__all_districts__";
function RedistribucionClient({ initialReport, districtNames, tableParams }) {
	const [report, setReport] = useState(initialReport);
	const [activeTab, setActiveTab] = useState("estaciones");
	const [selectedDistrict, setSelectedDistrict] = useState(initialReport.districtFilter ?? "");
	const [selectedDays, setSelectedDays] = useState(initialReport.analysisWindowDays);
	const [loadError, setLoadError] = useState(null);
	const [isReportLoading, setIsReportLoading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const didMountRef = useRef(false);
	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true;
			return;
		}
		const controller = new AbortController();
		let isActive = true;
		const refreshReport = async () => {
			setLoadError(null);
			setIsReportLoading(true);
			try {
				const response = await fetch(appRoutes.api.rebalancingReport({
					district: selectedDistrict || null,
					days: selectedDays
				}), {
					cache: "no-store",
					signal: controller.signal
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const nextReport = await response.json();
				if (!isActive) return;
				startTransition(() => {
					setReport(nextReport);
				});
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
				captureExceptionWithContext(error, {
					area: "dashboard.redistribucion",
					operation: "refreshReport",
					extra: {
						days: selectedDays,
						district: selectedDistrict || null
					}
				});
				if (!isActive) return;
				setLoadError("No se pudo actualizar el informe. Mostramos la ultima version disponible.");
			} finally {
				if (isActive) setIsReportLoading(false);
			}
		};
		refreshReport();
		return () => {
			isActive = false;
			controller.abort();
		};
	}, [
		selectedDays,
		selectedDistrict,
		startTransition
	]);
	function handleDistrictChange(value) {
		setSelectedDistrict(value);
	}
	function handleDaysChange(value) {
		setSelectedDays(value);
	}
	const isUpdatingReport = isReportLoading || isPending;
	const tabs = [
		{
			id: "estaciones",
			label: `Estaciones (${report.summary.totalStations})`
		},
		{
			id: "transferencias",
			label: `Transferencias (${report.transfers.length})`
		},
		{
			id: "kpis",
			label: "KPIs e impacto"
		},
		{
			id: "metodologia",
			label: "Metodología"
		}
	];
	return /* @__PURE__ */ jsxs(PageShell, {
		maxWidthClassName: "max-w-[1280px]",
		className: "bg-[var(--background)] sm:px-6",
		children: [
			/* @__PURE__ */ jsx(DashboardPageViewTracker, {
				routeKey: "dashboard_redistribucion",
				pageType: "dashboard",
				template: "redistribucion_report"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
							className: "text-2xl font-black text-[var(--foreground)]",
							children: "Redistribución"
						}), /* @__PURE__ */ jsxs("p", {
							className: "mt-0.5 text-sm text-[var(--muted)]",
							children: [
								"Diagnóstico operativo de estaciones · ventana ",
								report.analysisWindowDays,
								" días ·",
								" ",
								/* @__PURE__ */ jsx("time", {
									dateTime: report.generatedAt,
									children: new Date(report.generatedAt).toLocaleString("es-ES", {
										dateStyle: "short",
										timeStyle: "short"
									})
								})
							]
						})] }), /* @__PURE__ */ jsx(TrackedAnchor, {
							href: appRoutes.api.rebalancingReport({
								district: selectedDistrict || null,
								days: selectedDays,
								format: "csv"
							}),
							download: true,
							trackingEvent: buildExportClickEvent({
								surface: "dashboard",
								routeKey: "dashboard_redistribucion",
								source: "redistribucion_header",
								ctaId: "rebalancing_csv",
								entityType: "api",
								module: "redistribucion_export"
							}),
							className: "rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover,var(--card))]",
							children: "Descargar CSV"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 flex flex-wrap gap-3",
						children: [
							/* @__PURE__ */ jsxs(Select, {
								value: selectedDistrict || ALL_DISTRICTS_VALUE,
								onValueChange: (value) => {
									const nextValue = value === ALL_DISTRICTS_VALUE ? "" : value ?? "";
									trackUmamiEvent(buildFilterChangeEvent({
										surface: "dashboard",
										routeKey: "dashboard_redistribucion",
										module: "district_filter",
										source: "redistribucion_filters",
										destination: nextValue ? "filtered" : "all"
									}));
									handleDistrictChange(nextValue);
								},
								children: [/* @__PURE__ */ jsxs(SelectTrigger, {
									"aria-label": "Filtrar redistribucion por barrio",
									className: "min-h-9 min-w-[230px] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
								}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
									value: ALL_DISTRICTS_VALUE,
									children: "Todos los barrios"
								}), districtNames.map((d) => /* @__PURE__ */ jsx(SelectItem, {
									value: d,
									children: d
								}, d))] })]
							}),
							/* @__PURE__ */ jsxs(Select, {
								value: String(selectedDays),
								onValueChange: (value) => {
									const nextValue = Number(value);
									trackUmamiEvent(buildFilterChangeEvent({
										surface: "dashboard",
										routeKey: "dashboard_redistribucion",
										module: "analysis_window",
										source: "redistribucion_filters",
										period: `${nextValue}_days`
									}));
									handleDaysChange(nextValue);
								},
								children: [/* @__PURE__ */ jsxs(SelectTrigger, {
									"aria-label": "Cambiar ventana temporal del informe",
									className: "min-h-9 min-w-[190px] bg-[var(--card)]",
									children: [/* @__PURE__ */ jsx(SelectValue, {}), /* @__PURE__ */ jsx(SelectIcon, {})]
								}), /* @__PURE__ */ jsx(SelectContent, { children: ANALYSIS_WINDOWS.map((d) => /* @__PURE__ */ jsxs(SelectItem, {
									value: String(d),
									children: [
										"Últimos ",
										d,
										" días"
									]
								}, d)) })]
							}),
							isUpdatingReport && /* @__PURE__ */ jsx("span", {
								className: "self-center text-xs text-[var(--muted)] animate-pulse",
								children: "Actualizando…"
							})
						]
					}),
					loadError ? /* @__PURE__ */ jsx(Alert, {
						variant: "warning",
						children: loadError
					}) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mb-6",
				children: /* @__PURE__ */ jsx(RebalancingSummaryCards, { summary: report.summary })
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				value: activeTab,
				onValueChange: (value) => {
					if (!tabs.some((tab) => tab.id === value) || value === activeTab) return;
					const nextTab = value;
					trackUmamiEvent(buildPanelOpenEvent({
						surface: "dashboard",
						routeKey: "dashboard_redistribucion",
						module: nextTab,
						source: "redistribucion_tabs"
					}));
					setActiveTab(nextTab);
				},
				children: [
					/* @__PURE__ */ jsx(TabsList, {
						className: "mb-4 gap-1 border-b border-[var(--border)]",
						"aria-label": "Secciones del informe de redistribucion",
						children: tabs.map((tab) => /* @__PURE__ */ jsx(TabsTrigger, {
							value: tab.id,
							className: "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
							children: tab.label
						}, tab.id))
					}),
					/* @__PURE__ */ jsxs(TabsContent, {
						className: "space-y-6",
						value: "estaciones",
						children: [/* @__PURE__ */ jsx(ClassificationLegend, {}), /* @__PURE__ */ jsx(RebalancingTable, {
							diagnostics: report.diagnostics,
							initialParams: tableParams
						})]
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "transferencias",
						children: /* @__PURE__ */ jsx(TransferTable, { transfers: report.transfers })
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "kpis",
						children: /* @__PURE__ */ jsx(KpiCards, {
							kpis: report.kpis,
							baseline: report.baselineComparison
						})
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						className: "space-y-6",
						value: "metodologia",
						children: /* @__PURE__ */ jsx(MetodologiaPanel, {})
					})
				]
			})
		]
	});
}
function MetodologiaPanel() {
	return /* @__PURE__ */ jsxs("div", {
		className: "prose prose-sm max-w-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--foreground)]",
		children: [
			/* @__PURE__ */ jsx("h2", { children: "Cómo funciona el sistema de redistribución" }),
			/* @__PURE__ */ jsx("h3", { children: "1. Diagnóstico estructural (clasificación A-F)" }),
			/* @__PURE__ */ jsxs("p", { children: [
				"Cada estación se clasifica según su comportamiento histórico en los últimos N días. La clasificación se basa en ocupación media, porcentaje de tiempo vacía/llena, rotación relativa e immobilidad. El sistema tiene 6 clases: ",
				/* @__PURE__ */ jsx("strong", { children: "A Sobrestock" }),
				", ",
				/* @__PURE__ */ jsx("strong", { children: "B Déficit" }),
				",",
				" ",
				/* @__PURE__ */ jsx("strong", { children: "C Saturación puntual" }),
				", ",
				/* @__PURE__ */ jsx("strong", { children: "D Vaciado puntual" }),
				",",
				" ",
				/* @__PURE__ */ jsx("strong", { children: "E Equilibrada" }),
				" y ",
				/* @__PURE__ */ jsx("strong", { children: "F Revisar dato" }),
				"."
			] }),
			/* @__PURE__ */ jsx("h3", { children: "2. Tipología inferida" }),
			/* @__PURE__ */ jsxs("p", { children: [
				"El tipo de estación (residencial, oficinas, intermodal, turística, ocio, mixta) se infiere automáticamente de los patrones horarios históricos. Esto define la ",
				/* @__PURE__ */ jsx("em", { children: "banda objetivo" }),
				": el rango de ocupación aceptable para cada tipo y franja horaria."
			] }),
			/* @__PURE__ */ jsx("h3", { children: "3. Predicción de riesgo (1h/3h)" }),
			/* @__PURE__ */ jsx("p", { children: "Se estima la probabilidad de vaciado o llenado en las próximas 1 y 3 horas mezclando el estado actual con el patrón histórico esperado. La influencia del estado actual decrece con el horizonte." }),
			/* @__PURE__ */ jsx("h3", { children: "4. Red y elasticidad" }),
			/* @__PURE__ */ jsx("p", { children: "Antes de urgir una intervención, el sistema evalúa si las estaciones cercanas (radio 500m) pueden absorber la demanda. Si existen alternativas robustas, la urgencia se reduce hasta un 50%." }),
			/* @__PURE__ */ jsx("h3", { children: "5. Origen-destino y logística" }),
			/* @__PURE__ */ jsx("p", { children: "El algoritmo de matching empareja donantes (exceso) con receptoras (déficit) considerando distancia, urgencia relativa y zona. Cada transferencia incluye número de bicis, ventana horaria sugerida, impacto esperado y coste logístico normalizado." }),
			/* @__PURE__ */ jsx("h3", { children: "Limitaciones" }),
			/* @__PURE__ */ jsxs("ul", { children: [
				/* @__PURE__ */ jsx("li", { children: "No hay datos de viajes individuales ni ID de bicicleta." }),
				/* @__PURE__ */ jsx("li", { children: "El clima y eventos no se modelan explícitamente (solo a través del patrón histórico)." }),
				/* @__PURE__ */ jsx("li", { children: "Las predicciones son estimaciones estadísticas, no certezas." }),
				/* @__PURE__ */ jsx("li", { children: "Los umbrales son configurables y deben calibrarse tras observar resultados reales." })
			] })
		]
	});
}
//#endregion
export { RedistribucionClient };

//# sourceMappingURL=RedistribucionClient-Cz9IgAoT.js.map