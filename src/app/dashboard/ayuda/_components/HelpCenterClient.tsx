'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'alertas-activas',
    category: 'Alertas',
    question: 'Cuando una estacion entra en alerta?',
    answer: `Se evalua una ventana movil de ${ANALYTICS_WINDOWS.alertWindowHours} horas. Se genera alerta si bicis medias < ${ALERT_THRESHOLDS.lowBikes} o anclajes libres < ${ALERT_THRESHOLDS.lowAnchors}.`,
  },
  {
    id: 'severidad-alertas',
    category: 'Alertas',
    question: 'Que significa una alerta critica?',
    answer:
      'Severidad 2 indica un nivel mas extremo de escasez. Es una estacion prioritaria para redistribucion.',
  },
  {
    id: 'rotacion-14d',
    category: 'Rankings',
    question: 'Que es la metrica de rotacion 14d?',
    answer:
      'Es una puntuacion de uso calculada sobre la ventana reciente de analitica. Ayuda a identificar estaciones con mayor dinamica.',
  },
  {
    id: 'horas-problema',
    category: 'Rankings',
    question: 'Como se calcula horas problema?',
    answer:
      'Suma horas con bicis casi vacias y horas con anclajes casi llenos durante la ventana de ranking.',
  },
  {
    id: 'proyeccion',
    category: 'Prediccion',
    question: 'La proyeccion de +30/+60 min es un modelo IA?',
    answer:
      'No. Es una estimacion basada en patrones historicos por franja horaria y ocupacion reciente de la estacion.',
  },
  {
    id: 'matriz-od',
    category: 'Movilidad',
    question: 'La matriz O-D representa viajes reales?',
    answer:
      'No directamente. Es una inferencia agregada por distrito usando variaciones de disponibilidad por hora.',
  },
  {
    id: 'destinos-estimados',
    category: 'Movilidad',
    question: 'Como se obtienen los destinos estimados?',
    answer:
      'Se reparte el flujo saliente del distrito segun el peso relativo de entradas en otros distritos.',
  },
  {
    id: 'actualizacion',
    category: 'Datos',
    question: 'Con que frecuencia se actualiza el dashboard?',
    answer:
      'Las consultas API usan cache corta. El sistema de recogida se ejecuta periodicamente y refresca las agregaciones.',
  },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function HelpCenterClient() {
  const [query, setQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return FAQ_ITEMS;
    }

    return FAQ_ITEMS.filter((item) => {
      const searchable = normalize(`${item.category} ${item.question} ${item.answer}`);
      return searchable.includes(normalizedQuery);
    });
  }, [query]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(filteredItems.map((item) => item.category));
    return Array.from(uniqueCategories.values());
  }, [filteredItems]);

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="hero-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Centro de ayuda</p>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
              Preguntas frecuentes del dashboard clasico
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Metodologia, reglas de negocio y lectura correcta de metricas.
            </p>
          </div>
          <Link href="/dashboard" className="icon-button">
            Volver al dashboard
          </Link>
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          placeholder="Buscar por tema, metrica o palabra clave"
        />
      </header>

      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="dashboard-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Categorias</h2>
          <ul className="space-y-2 text-xs text-[var(--muted)]">
            {categories.map((category) => {
              const total = filteredItems.filter((item) => item.category === category).length;

              return (
                <li key={category} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
                  <span>{category}</span>
                  <span className="kpi-chip">{total}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="dashboard-card">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Resultados ({filteredItems.length})
          </h2>

          {filteredItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No hay coincidencias para la busqueda actual.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isOpen = openItemId === item.id;

                return (
                  <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                      onClick={() => setOpenItemId((current) => (current === item.id ? '' : item.id))}
                      aria-expanded={isOpen}
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                          {item.category}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                          {item.question}
                        </p>
                      </div>
                      <span className="text-xl leading-none text-[var(--muted)]">
                        {isOpen ? '-' : '+'}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                        {item.answer}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
