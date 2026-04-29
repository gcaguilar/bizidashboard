'use client';

import { Fragment, useState, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StationDiagnostic, StationClassification, ActionGroup, Urgency } from '@/types/rebalancing';

type TableParams = {
  sort?: string;
  filter?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type Props = {
  diagnostics: StationDiagnostic[];
  initialParams?: TableParams;
};

const PAGE_SIZE = 20;
const SELECT_ALL_VALUE = '__all__';
const COLUMN_VISIBILITY_LABELS: Record<string, string> = {
  select: '☑',
  stationName: 'Estación',
  districtName: 'Barrio',
  inferredType: 'Tipo',
  classification: 'Clasificación',
  currentOccupancy: 'Ocupación',
  actionGroup: 'Acción',
  urgency: 'Urgencia',
  priorityScore: 'Score',
  expand: 'Expand',
};

// ─── CSV Export ────────────────────────────────────────────────────────────

function copyToClipboard(diagnostics: StationDiagnostic[]) {
  const text = diagnostics
    .map((d) => [
      d.stationName,
      d.stationId,
      d.districtName ?? '',
      d.inferredType,
      CLASSIFICATION_LABEL[d.classification],
      `${Math.round(d.currentOccupancy * 100)}%`,
      ACTION_LABEL[d.actionGroup],
      URGENCY_LABEL[d.urgency],
    ].join('\t'))
    .join('\n');
  navigator.clipboard.writeText(text);
}

function exportToCSV(diagnostics: StationDiagnostic[], filename: string) {
  const headers = ['Estación', 'ID', 'Barrio', 'Tipo', 'Clasificación', 'Ocupación', 'Banda', 'Acción', 'Urgencia', 'Score'];
  const rows = diagnostics.map((d) => [
    d.stationName,
    d.stationId,
    d.districtName ?? '',
    d.inferredType,
    CLASSIFICATION_LABEL[d.classification],
    `${Math.round(d.currentOccupancy * 100)}%`,
    `${Math.round(d.targetBand.min * 100)}%-${Math.round(d.targetBand.max * 100)}%`,
    ACTION_LABEL[d.actionGroup],
    URGENCY_LABEL[d.urgency],
    Math.round(d.priorityScore * 100).toString(),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const CLASSIFICATION_STYLE: Record<StationClassification, string> = {
  overstock: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  deficit: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  peak_saturation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  peak_emptying: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  balanced: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  data_review: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
};

const CLASSIFICATION_LABEL: Record<StationClassification, string> = {
  overstock: 'A Sobrestock',
  deficit: 'B Déficit',
  peak_saturation: 'C Sat. punta',
  peak_emptying: 'D Vaciado punta',
  balanced: 'E Equilibrada',
  data_review: 'F Revisar dato',
};

const ACTION_LABEL: Record<ActionGroup, string> = {
  donor: 'Donar',
  receptor: 'Recibir',
  peak_remove: 'Retirar (prev.)',
  peak_fill: 'Reponer (prev.)',
  stable: 'No actuar',
  review: 'Revisar',
};

const URGENCY_STYLE: Record<Urgency, string> = {
  critical: 'text-rose-600 dark:text-rose-400 font-bold',
  high: 'text-red-600 dark:text-red-400 font-semibold',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-slate-500',
  none: 'text-slate-400',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: '—',
};

const CLASSIFICATION_OPTIONS = [
  { value: '', label: 'Todas' },
  ...Object.entries(CLASSIFICATION_LABEL).map(([value, label]) => ({ value, label })),
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas' },
  ...Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label })),
];

const URGENCY_OPTIONS = [
  { value: '', label: 'Todas' },
  ...Object.entries(URGENCY_LABEL).map(([value, label]) => ({ value, label })),
];

// ─── Quick filters ────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { id: 'all', label: 'Todas', filter: null },
  { id: 'donors', label: 'Donantes', filter: { id: 'actionGroup', value: 'donor' } },
  { id: 'receptors', label: 'Receptoras', filter: { id: 'actionGroup', value: 'receptor' } },
  { id: 'critical', label: 'Críticas', filter: { id: 'urgency', value: 'critical' } },
  { id: 'high', label: 'Altas', filter: { id: 'urgency', value: 'high' } },
  { id: 'review', label: 'Revisar', filter: { id: 'actionGroup', value: 'review' } },
];

// ─── Occupancy bar ────────────────────────────────────────────────────────────

function OccupancyBar({
  occupancy,
  bandMin,
  bandMax,
}: {
  occupancy: number;
  bandMin: number;
  bandMax: number;
}) {
  const pct = Math.round(occupancy * 100);
  const inBand = occupancy >= bandMin && occupancy <= bandMax;
  const barColor = inBand
    ? 'bg-green-500'
    : occupancy < bandMin
    ? 'bg-red-500'
    : 'bg-orange-500';

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-20 rounded-full bg-[var(--border)]">
        <div
          className="absolute top-0 h-full rounded-full bg-green-200 dark:bg-green-900/50"
          style={{ left: `${bandMin * 100}%`, width: `${(bandMax - bandMin) * 100}%` }}
        />
        <div
          className={`absolute top-0 h-full w-1 rounded-full ${barColor}`}
          style={{ left: `${Math.min(99, pct)}%` }}
        />
      </div>
      <span className="tabular-nums text-xs">{pct}%</span>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<StationDiagnostic>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        aria-label="Seleccionar todas las filas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Seleccionar estación ${row.original.stationName}`}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    size: 40,
    enableSorting: false,
  },
  {
    accessorKey: 'stationName',
    header: 'Estación',
    cell: ({ row }) => (
      <>
        <p className="font-medium text-[var(--foreground)]">{row.original.stationName}</p>
        <p className="text-xs text-[var(--muted)]">#{row.original.stationId}</p>
      </>
    ),
  },
  {
    accessorKey: 'districtName',
    header: 'Barrio',
    cell: ({ getValue }) => <span className="text-xs text-[var(--muted)]">{getValue<string>() ?? '—'}</span>,
  },
  {
    id: 'inferredType',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-xs text-[var(--muted)] capitalize">{row.original.inferredType}</span>
    ),
  },
  {
    accessorKey: 'classification',
    header: 'Clasificación',
    cell: ({ getValue }) => {
      const value = getValue<StationClassification>();
      return (
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[value]}`}>
          {CLASSIFICATION_LABEL[value]}
        </span>
      );
    },
  },
  {
    accessorKey: 'currentOccupancy',
    header: 'Ocupación / Banda',
    cell: ({ row }) => (
      <OccupancyBar
        occupancy={row.original.currentOccupancy}
        bandMin={row.original.targetBand.min}
        bandMax={row.original.targetBand.max}
      />
    ),
  },
  {
    accessorKey: 'actionGroup',
    header: 'Acción',
    cell: ({ getValue }) => (
      <span className="text-xs font-medium text-[var(--foreground)]">
        {ACTION_LABEL[getValue<ActionGroup>()]}
      </span>
    ),
  },
  {
    accessorKey: 'urgency',
    header: 'Urgencia',
    cell: ({ getValue }) => {
      const value = getValue<Urgency>();
      return <span className={`text-xs ${URGENCY_STYLE[value]}`}>{URGENCY_LABEL[value]}</span>;
    },
  },
  {
    accessorKey: 'priorityScore',
    header: 'Score',
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-[var(--muted)]">
        {(getValue<number>() * 100).toFixed(0)}
      </span>
    ),
  },
  {
    id: 'expand',
    header: '',
    cell: () => <span className="text-xs text-[var(--muted)]" />,
  },
];

// ─── Filter controls ────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <Select
      value={value || SELECT_ALL_VALUE}
      onValueChange={(nextValue) =>
        onChange(nextValue && nextValue !== SELECT_ALL_VALUE ? nextValue : '')
      }
    >
      <SelectTrigger aria-label={ariaLabel} className="h-8 min-h-8 rounded-md px-2 py-0 text-xs">
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value || SELECT_ALL_VALUE} value={opt.value || SELECT_ALL_VALUE}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RebalancingTable({ diagnostics, initialParams }: Props) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (initialParams?.sort) {
      const [id, desc] = initialParams.sort.split(':');
      return [{ id, desc: desc === 'desc' }];
    }
    return [{ id: 'priorityScore', desc: true }];
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    if (initialParams?.filter) {
      const [id, value] = initialParams.filter.split(':');
      return [{ id, value }];
    }
    return [];
  });
  const [globalFilter, setGlobalFilter] = useState(initialParams?.search ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? PAGE_SIZE,
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    select: true,
    stationName: true,
    districtName: true,
    inferredType: true,
    classification: true,
    currentOccupancy: true,
    actionGroup: true,
    urgency: true,
    priorityScore: true,
    expand: true,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [openToolbarAccordions, setOpenToolbarAccordions] = useState<string[]>([]);

  const handleToggle = useCallback((stationId: string) => {
    setExpandedId((id) => (id === stationId ? null : stationId));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, stationId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(stationId);
    }
  }, [handleToggle]);

  const handleHeaderClick = useCallback((e: React.MouseEvent, column: { toggleSorting: (desc?: boolean) => void; getCanSort: () => boolean; getIsSorted: () => false | 'asc' | 'desc'; id: string }) => {
    if (!column.getCanSort()) return;
    if (e.shiftKey && sorting.length > 0) {
      const currentSort = sorting.find((s) => s.id === column.id);
      if (currentSort) {
        setSorting((prev) => prev.map((s) => s.id === column.id ? { ...s, desc: !s.desc } : s));
      } else {
        setSorting((prev) => [...prev, { id: column.id, desc: true }]);
      }
    } else {
      column.toggleSorting();
    }
  }, [sorting]);

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (sorting.length > 0) {
      params.set('sort', `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`);
    }
    if (globalFilter) params.set('search', globalFilter);
    if (columnFilters.length > 0) {
      params.set('filter', `${columnFilters[0].id}:${columnFilters[0].value}`);
    }
    if (pagination.pageIndex > 0) params.set('page', String(pagination.pageIndex));
    if (pagination.pageSize !== PAGE_SIZE) params.set('pageSize', String(pagination.pageSize));

    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [sorting, globalFilter, columnFilters, pagination]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // TanStack Table intentionally returns non-memoizable functions; keep this local opt-out explicit.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: diagnostics,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      columnVisibility,
      rowSelection,
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
    enableMultiSort: true,
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  const selectedCount = Object.keys(rowSelection).length;

  const applyQuickFilter = useCallback((filterId: string) => {
    setActiveQuickFilter(filterId);
    const qf = QUICK_FILTERS.find((f) => f.id === filterId);
    if (!qf || !qf.filter) {
      setColumnFilters([]);
    } else {
      setColumnFilters([qf.filter]);
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar estación o barrio..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            aria-label="Buscar estación o barrio"
            className="h-8 min-h-8 w-40 rounded-md bg-[var(--background)] px-3 text-xs"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-1">
          {QUICK_FILTERS.map((qf) => (
            <Button
              key={qf.id}
              onClick={() => applyQuickFilter(qf.id)}
              variant={activeQuickFilter === qf.id ? 'default' : 'chip'}
              size="sm"
              className={`min-h-7 rounded px-2 py-1 text-xs ${
                activeQuickFilter === qf.id
                  ? 'border-[var(--accent)]'
                  : 'text-[var(--foreground)]'
              }`}
            >
              {qf.label}
            </Button>
          ))}
        </div>

        <FilterSelect
          value={(columnFilters.find((f) => f.id === 'classification')?.value as string) ?? ''}
          onChange={(value) =>
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== 'classification'),
              ...(value ? [{ id: 'classification', value }] : []),
            ])
          }
          options={CLASSIFICATION_OPTIONS}
          ariaLabel="Filtrar por clasificación"
        />
        <FilterSelect
          value={(columnFilters.find((f) => f.id === 'actionGroup')?.value as string) ?? ''}
          onChange={(value) =>
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== 'actionGroup'),
              ...(value ? [{ id: 'actionGroup', value }] : []),
            ])
          }
          options={ACTION_OPTIONS}
          ariaLabel="Filtrar por acción"
        />
        <FilterSelect
          value={(columnFilters.find((f) => f.id === 'urgency')?.value as string) ?? ''}
          onChange={(value) =>
            setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== 'urgency'),
              ...(value ? [{ id: 'urgency', value }] : []),
            ])
          }
          options={URGENCY_OPTIONS}
          ariaLabel="Filtrar por urgencia"
        />
        {(globalFilter || columnFilters.length > 0) && (
          <Button
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
              setActiveQuickFilter('all');
            }}
            variant="ghost"
            size="sm"
            className="min-h-7 px-1 text-xs text-[var(--accent)] hover:underline"
          >
            Limpiar filtros
          </Button>
        )}
        <Accordion
          value={openToolbarAccordions}
          onValueChange={setOpenToolbarAccordions}
          className="w-full sm:w-auto"
        >
          <AccordionItem value="columns" className="rounded-md border border-[var(--border)] bg-[var(--surface)]">
            <AccordionTrigger
              className="px-2 py-1.5 text-xs text-[var(--accent)] [&>span]:text-xs [&>span]:font-semibold"
            >
              Columnas
            </AccordionTrigger>
            <AccordionContent className="space-y-1 border-none p-2 text-xs">
              {table.getAllLeafColumns().map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 whitespace-nowrap text-xs text-[var(--foreground)]"
                >
                  <Checkbox
                    checked={column.getIsVisible()}
                    onChange={() => column.toggleVisibility()}
                    aria-label={`Mostrar columna ${COLUMN_VISIBILITY_LABELS[column.id] ?? column.id}`}
                  />
                  {COLUMN_VISIBILITY_LABELS[column.id] ?? column.id}
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {totalRows > 0 && (
          <Button
            onClick={() => {
              const data = selectedCount > 0
                ? table.getSelectedRowModel().rows.map((r) => r.original)
                : table.getFilteredRowModel().rows.map((r) => r.original);
              copyToClipboard(data);
            }}
            variant="ghost"
            size="sm"
            className="min-h-7 px-1 text-xs text-[var(--accent)] hover:underline"
          >
            {selectedCount > 0 ? `Copiar ${selectedCount}` : 'Copiar'}
          </Button>
        )}
        {totalRows > 0 && (
          <Button
            onClick={() => exportToCSV(table.getFilteredRowModel().rows.map((r) => r.original), 'estaciones-redistribucion')}
            variant="ghost"
            size="sm"
            className="min-h-7 px-1 text-xs text-[var(--accent)] hover:underline"
          >
            Exportar CSV
          </Button>
        )}
        {selectedCount > 0 && (
          <span className="text-xs text-[var(--muted)]">
            {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="overflow-x-auto rounded-xl border border-[var(--border)] max-w-[100vw]">
        <Table className="w-full text-sm">
          <TableHeader className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`h-auto select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold normal-case tracking-normal text-[var(--muted)] ${
                      header.column.getCanSort() ? 'cursor-pointer hover:text-[var(--foreground)]' : ''
                    }`}
                    onClick={(e) => handleHeaderClick(e, header.column)}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-[var(--border)]">
            {table.getRowModel().rows.map((row) => {
              const isExpanded = expandedId === row.original.stationId;
              const diagnostic = row.original;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover,var(--surface))]"
                    onClick={() => handleToggle(diagnostic.stationId)}
                    onKeyDown={(e) => handleKeyDown(e, diagnostic.stationId)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const colId = cell.column.id;
                      if (colId === 'expand') {
                        return (
                          <TableCell key={colId} className="px-3 py-2.5 text-xs text-[var(--muted)]">
                            {isExpanded ? '▲' : '▼'}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={colId} className="px-3 py-2.5">
                          {typeof cell.column.columnDef.cell === 'function'
                            ? cell.column.columnDef.cell(cell.getContext())
                            : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={11} className="border-b border-[var(--border)] bg-[var(--surface-secondary,var(--surface))] px-4 pb-4 pt-2">
                        <div className="grid gap-4 text-xs sm:grid-cols-2">
                          <div>
                            <p className="mb-1 font-semibold text-[var(--foreground)]">Razones de clasificación</p>
                            <ul className="space-y-1 text-[var(--muted)]">
                              {diagnostic.classificationReasons.map((r, i) => (
                                <li key={i} className="flex gap-1">
                                  <span className="shrink-0 text-[var(--accent)]">›</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 font-semibold text-[var(--foreground)]">Razones de acción</p>
                            <ul className="space-y-1 text-[var(--muted)]">
                              {diagnostic.actionReasons.map((r, i) => (
                                <li key={i} className="flex gap-1">
                                  <span className="shrink-0 text-[var(--accent)]">›</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 font-semibold text-[var(--foreground)]">Predicción</p>
                            <p className="text-[var(--muted)]">
                              Riesgo vacío 1h: <strong>{Math.round(diagnostic.risk.riskEmptyAt1h * 100)}%</strong>{' '}
                              · Riesgo lleno 1h: <strong>{Math.round(diagnostic.risk.riskFullAt1h * 100)}%</strong>{' '}
                              · Autocorrección:{' '}
                              <strong>{Math.round(diagnostic.risk.selfCorrectionProbability * 100)}%</strong>
                              {diagnostic.risk.estimatedRecoveryMinutes !== null &&
                                ` · Recuperación: ~${diagnostic.risk.estimatedRecoveryMinutes} min`}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 font-semibold text-[var(--foreground)]">Red cercana</p>
                            <p className="text-[var(--muted)]">
                              {diagnostic.network.nearbyStations.length} estaciones en radio 500m · Ajuste urgencia:{' '}
                              {Math.round(diagnostic.network.urgencyAdjustment * 100)}%
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
        {totalRows === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            No hay estaciones que mostrar con los filtros actuales.
          </p>
        )}
      </ScrollArea>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>
              {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, totalRows)} de {totalRows}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(nextValue) => {
                if (!nextValue) {
                  return;
                }
                setPagination({ ...pagination, pageSize: Number(nextValue), pageIndex: 0 });
              }}
            >
              <SelectTrigger
                aria-label="Filas por página"
                className="h-7 min-h-7 w-20 rounded-md bg-[var(--background)] px-2 py-0 text-xs"
              >
                <SelectValue />
                <SelectIcon />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>por página</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setPagination({ ...pagination, pageIndex: 0 })}
              disabled={pageIndex === 0}
              variant="ghost"
              size="sm"
              className="h-7 min-h-7 rounded px-2 py-1 text-xs"
            >
              ««
            </Button>
            <Button
              onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pageIndex - 1) })}
              disabled={pageIndex === 0}
              variant="ghost"
              size="sm"
              className="h-7 min-h-7 rounded px-2 py-1 text-xs"
            >
              «
            </Button>
            <Button
              onClick={() => setPagination({ ...pagination, pageIndex: Math.min(pageCount - 1, pageIndex + 1) })}
              disabled={pageIndex >= pageCount - 1}
              variant="ghost"
              size="sm"
              className="h-7 min-h-7 rounded px-2 py-1 text-xs"
            >
              »
            </Button>
            <Button
              onClick={() => setPagination({ ...pagination, pageIndex: pageCount - 1 })}
              disabled={pageIndex >= pageCount - 1}
              variant="ghost"
              size="sm"
              className="h-7 min-h-7 rounded px-2 py-1 text-xs"
            >
              »»
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
