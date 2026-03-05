'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

type HistoryApiResponse = {
  source?: {
    provider?: string;
    gbfsDiscoveryUrl?: string;
  };
  coverage?: {
    firstRecordedAt?: string | null;
    lastRecordedAt?: string | null;
    totalDays?: number;
    totalSamples?: number;
    totalStations?: number;
  };
};

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
    id: 'alerta-persistente',
    category: 'Alertas',
    question: 'Por que la alerta sigue activa aunque la estacion mejoro?',
    answer:
      'Porque se calcula sobre una ventana movil y no solo con la ultima lectura. La alerta desaparece cuando la media reciente vuelve a valores normales.',
  },
  {
    id: 'alerta-vacia-llena',
    category: 'Alertas',
    question: 'Que diferencia hay entre alerta de vacia y de llena?',
    answer:
      'Vacia significa riesgo de falta de bicis para retirar. Llena significa falta de anclajes libres para devolver bicis. Ambas afectan la operativa.',
  },
  {
    id: 'rotacion-14d',
    category: 'Clasificaciones',
    question: 'Que es la metrica de rotacion 14d?',
    answer:
      'Es una puntuacion de uso calculada sobre la ventana reciente de analitica. Ayuda a identificar estaciones con mayor dinamica.',
  },
  {
    id: 'horas-problema',
    category: 'Clasificaciones',
    question: 'Como se calcula horas problema?',
    answer:
      'Suma horas con bicis casi vacias y horas con anclajes casi llenos durante la ventana de ranking.',
  },
  {
    id: 'ranking-no-aparece',
    category: 'Clasificaciones',
    question: 'Por que una estacion no aparece en el ranking?',
    answer:
      'Puede no aparecer por falta de datos suficientes en la ventana analitica o porque queda fuera del limite de resultados mostrados.',
  },
  {
    id: 'ranking-rotacion-vs-criticidad',
    category: 'Clasificaciones',
    question: 'Que diferencia hay entre rotacion y criticidad?',
    answer:
      'Rotacion mide dinamica de uso. Criticidad prioriza estaciones con mas horas problematicas. Son indicadores complementarios para decisiones distintas.',
  },
  {
    id: 'proyeccion',
    category: 'Prediccion',
    question: 'La proyeccion de +30/+60 min es un modelo IA?',
    answer:
      'No. Es una estimacion basada en patrones historicos por franja horaria y ocupacion reciente de la estacion.',
  },
  {
    id: 'confianza-prediccion',
    category: 'Prediccion',
    question: 'Que significa el porcentaje de confianza?',
    answer:
      'Es un indicador de robustez de la estimacion segun la cantidad de muestra reciente disponible. Mayor confianza implica menor incertidumbre.',
  },
  {
    id: 'prediccion-sin-datos',
    category: 'Prediccion',
    question: 'Por que a veces no hay prediccion o aparece muy plana?',
    answer:
      'Cuando falta historico suficiente, el sistema usa valores de respaldo mas conservadores y la curva puede verse menos variable.',
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
    id: 'balance-neto',
    category: 'Movilidad',
    question: 'Que indica un balance neto positivo o negativo?',
    answer:
      'Positivo indica que el barrio recibe mas flujo del que envia. Negativo indica que emite mas del que recibe en el periodo seleccionado.',
  },
  {
    id: 'periodos-flujo',
    category: 'Movilidad',
    question: 'Como cambian los resultados por franja horaria?',
    answer:
      'Los filtros de manana, mediodia, tarde y noche recalculan volumen, matriz y rutas destacadas solo para ese tramo horario.',
  },
  {
    id: 'diagrama-chord',
    category: 'Movilidad',
    question: 'Como leer el diagrama chord?',
    answer:
      'Cada nodo es un distrito y cada arco representa flujo estimado entre dos zonas. Cuanto mas intenso y grueso el arco, mayor volumen.',
  },
  {
    id: 'actualizacion',
    category: 'Datos',
    question: 'Con que frecuencia se actualiza el dashboard?',
    answer:
      'Las consultas API usan cache corta. El sistema de recogida se ejecuta periodicamente y refresca las agregaciones.',
  },
  {
    id: 'ventana-analitica',
    category: 'Datos',
    question: `Que ventana usa la analitica principal?`,
    answer:
      `Los rankings usan una ventana de ${ANALYTICS_WINDOWS.rankingDays} dias y las alertas se calculan sobre ${ANALYTICS_WINDOWS.alertWindowHours} horas moviles.`,
  },
  {
    id: 'fuente-datos',
    category: 'Datos',
    question: 'De donde salen los datos de estaciones?',
    answer:
      'La fuente principal es el feed GBFS oficial de Bizi Zaragoza: https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json. A partir de ese discovery se consultan station_information y station_status de forma periodica, y luego se validan y agregan para analitica.',
  },
  {
    id: 'sin-datos',
    category: 'Datos',
    question: 'Por que a veces aparece "sin datos"?',
    answer:
      'Puede ocurrir por estaciones nuevas, incidencias temporales en la recogida o falta de muestra minima para calcular metricas fiables.',
  },
  {
    id: 'busqueda',
    category: 'Uso',
    question: 'Como busco una estacion rapidamente?',
    answer:
      'Puedes buscar por nombre o ID. El buscador ignora mayusculas y acentos para encontrar coincidencias de forma mas flexible.',
  },
  {
    id: 'estados-mapa',
    category: 'Uso',
    question: 'Que significan los colores del mapa?',
    answer:
      'Verde indica buena disponibilidad, amarillo nivel intermedio y rojo estado critico respecto a la ocupacion de la estacion.',
  },
  {
    id: 'detalle-estacion',
    category: 'Uso',
    question: 'Cuando debo ir a la pagina de detalle de estacion?',
    answer:
      'Cuando necesites analisis profundo: benchmarking, prediccion temporal, curva horaria y comparativas para una estacion concreta.',
  },
  {
    id: 'api-documentacion',
    category: 'Soporte',
    question: 'Hay endpoints API para integrar estos datos?',
    answer:
      'Si. El proyecto expone endpoints para estado, alertas, rankings, patrones, heatmap y movilidad. Usa la documentacion API para ver formatos y parametros.',
  },
  {
    id: 'contacto-soporte',
    category: 'Soporte',
    question: 'Como reporto una incidencia de datos?',
    answer:
      'Incluye estacion, hora aproximada, vista donde aparece el problema y una captura. Con ese contexto se acelera la revision tecnica.',
  },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Sin datos';
  }

  return parsed.toLocaleString('es-ES');
}

export function HelpCenterClient() {
  const [query, setQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');
  const [historyMeta, setHistoryMeta] = useState<HistoryApiResponse | null>(null);

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

  const groupedItems = useMemo(() => {
    const map = new Map<string, FaqItem[]>();

    for (const item of filteredItems) {
      const rows = map.get(item.category) ?? [];
      rows.push(item);
      map.set(item.category, rows);
    }

    return Array.from(map.entries());
  }, [filteredItems]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadHistoryMeta = async () => {
      try {
        const response = await fetch('/api/history', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el historico.');
        }

        const payload = (await response.json()) as HistoryApiResponse;

        if (!isActive) {
          return;
        }

        setHistoryMeta(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Ayuda] No se pudo cargar metadata historica.', error);
      }
    };

    void loadHistoryMeta();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                B
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Bizi Analitica</h2>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
                Inicio
              </Link>
              <Link href="/dashboard/estaciones" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
                Estaciones
              </Link>
              <span className="border-b-2 border-[var(--accent)] pb-1 text-sm font-bold text-[var(--accent)]">
                Ayuda
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 sm:flex">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-44 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Buscar ayuda..."
              />
            </label>
            <Link href="/dashboard" className="icon-button" aria-label="Volver">
              Inicio
            </Link>
            <a
              href="/api/history"
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Historico completo"
            >
              Historico
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              Repositorio
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              Centro de ayuda
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--foreground)] md:text-5xl">
              Preguntas frecuentes
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Explora nuestra metodologia y resuelve dudas sobre como procesamos los datos de Bizi Zaragoza en tiempo real.
            </p>
          </div>

          <aside className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Cobertura de datos
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              Datos desde: <span className="font-semibold">{formatDateTime(historyMeta?.coverage?.firstRecordedAt)}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Ultima muestra: {formatDateTime(historyMeta?.coverage?.lastRecordedAt)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Dias disponibles: {historyMeta?.coverage?.totalDays ?? 0} · Estaciones activas:{' '}
              {historyMeta?.coverage?.totalStations ?? 0}
            </p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Fuente: {historyMeta?.source?.provider ?? 'Bizi Zaragoza GBFS'}
            </p>
            <a
              href={historyMeta?.source?.gbfsDiscoveryUrl ?? 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json'}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-xs font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2"
            >
              Ver feed de origen
            </a>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/api/history"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
              >
                Ver historico completo
              </a>
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Definicion API
              </a>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setQuery(category)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left transition hover:border-[var(--accent)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-xl font-black text-[var(--accent)]">
                {category.slice(0, 1)}
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">{category}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{filteredItems.filter((item) => item.category === category).length} respuestas disponibles.</p>
            </button>
          ))}
        </div>

        <div className="mt-14 space-y-8">
          {groupedItems.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
              No hay coincidencias para la busqueda actual.
            </p>
          ) : (
            groupedItems.map(([category, items]) => (
              <section key={category} className="space-y-4">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
                  <span className="h-1 w-8 rounded-full bg-[var(--accent)]" />
                  {category}
                </h2>

                <div className="space-y-3">
                  {items.map((item) => {
                    const isOpen = openItemId === item.id;

                    return (
                      <article key={item.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                          onClick={() => setOpenItemId((current) => (current === item.id ? '' : item.id))}
                          aria-expanded={isOpen}
                        >
                          <p className="text-base font-semibold text-[var(--foreground)]">{item.question}</p>
                          <span className="text-lg font-bold text-[var(--muted)]">{isOpen ? '-' : '+'}</span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]">
                            {item.answer}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 p-8 text-white">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold">No encontraste lo que buscabas?</h2>
            <p className="mt-2 text-sm text-white/85">
              Puedes consultar la definicion de la API y descargar el historico agregado disponible desde el primer registro.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--accent)]"
            >
              Definicion API
            </a>
            <a
              href="/api/history"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white"
            >
              Ver todos los datos
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 text-xs text-[var(--muted)] md:flex-row">
          <span>Panel de analitica Bizi Zaragoza</span>
          <div className="flex gap-6">
            <span>Privacidad</span>
            <span>Cookies</span>
            <span>Terminos de servicio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
