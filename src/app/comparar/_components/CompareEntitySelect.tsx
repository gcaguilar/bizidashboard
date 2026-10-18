'use client';

import { useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { rankComparisonOptions } from '@/lib/compare-search';
import type { InteractiveComparisonOption } from '@/lib/comparison-hub';
import { cn } from '@/lib/utils';

/**
 * Selector con búsqueda inteligente (autocompletado) para entidades con muchas
 * opciones (estaciones, barrios). Reutiliza el `Command`/`Popover` del sistema
 * de diseño y muestra favoritas y sugerencias populares antes de escribir.
 */
export function CompareEntitySelect({
  id,
  ariaLabel,
  options,
  value,
  onValueChange,
  popularHints,
  favoriteIds,
  searchPlaceholder,
}: {
  id?: string;
  ariaLabel: string;
  options: InteractiveComparisonOption[];
  value: string;
  onValueChange: (id: string) => void;
  popularHints?: readonly string[];
  favoriteIds?: readonly string[];
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value]
  );

  const labelById = useMemo(
    () => new Map(options.map((option) => [option.id, option.label])),
    [options]
  );

  const ranked = useMemo(
    () =>
      rankComparisonOptions({
        options,
        query,
        favoriteIds,
        popularHints,
      }),
    [options, query, favoriteIds, popularHints]
  );

  const favoriteSet = useMemo(() => new Set(favoriteIds ?? []), [favoriteIds]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery('');
        }
      }}
    >
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'mt-2 inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none transition',
          open && 'border-[var(--primary)]'
        )}
      >
        <span className="truncate text-left">
          {selected?.label ?? 'Selecciona una opción'}
        </span>
        <span aria-hidden className="text-xs text-[var(--muted)]">
          ▾
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2.5rem,30rem)]">
        <Command
          value={value || null}
          onValueChange={(nextValue) => {
            if (typeof nextValue === 'string' && nextValue) {
              onValueChange(nextValue);
              setOpen(false);
              setQuery('');
            }
          }}
          onInputValueChange={(nextValue) => setQuery(nextValue)}
          itemToStringLabel={(nextValue) => labelById.get(String(nextValue)) ?? String(nextValue)}
        >
          <CommandInput placeholder={searchPlaceholder ?? 'Buscar…'} autoFocus />
          {!query.trim() && (popularHints?.length ?? 0) > 0 ? (
            <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Sugerencias populares y favoritas
            </p>
          ) : null}
          <CommandList className="mt-2 max-h-72">
            <CommandGroup>
              {ranked.map((option) => (
                <CommandItem key={option.id} value={option.id}>
                  <span className="truncate">
                    {favoriteSet.has(option.id) ? `★ ${option.label}` : option.label}
                  </span>
                  {option.id === value ? (
                    <span className="ml-2 text-xs text-[var(--primary)]">✓</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandEmpty>Sin coincidencias.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
