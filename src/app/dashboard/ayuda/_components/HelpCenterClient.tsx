'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../../_components/GitHubRepoButton';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';

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

const CATEGORY_PRIORITY = [
  'Alertas',
  'Prediccion',
  'Movilidad',
  'Clasificaciones',
  'Datos',
  'Uso',
  'Soporte',
] as const;

const FAQ_PRIORITY_IDS = [
  'alertas-activas',
  'alerta-resuelta-significado',
  'severidad-alertas',
  'proyeccion',
  'prediccion-que-es',
  'confianza-prediccion',
  'prediccion-uso-practico',
  'calculo-rutas',
  'matriz-od',
  'demanda-no-viajes-reales',
  'movilidad-causalidad',
] as const;

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'alertas-activas',
    category: 'Alertas',
    question: 'Cuando una estacion entra en alerta?',
    answer: `Miramos las ultimas ${ANALYTICS_WINDOWS.alertWindowHours} horas (no solo el ultimo minuto). Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, la estacion entra en alerta.`,
  },
  {
    id: 'severidad-alertas',
    category: 'Alertas',
    question: 'Que significa una alerta critica?',
    answer:
      'Tenemos dos niveles: severidad 1 (media) y severidad 2 (critica). Critica significa que la situacion es mas urgente y esa estacion suele ir primero en la cola de redistribucion.',
  },
  {
    id: 'alerta-persistente',
    category: 'Alertas',
    question: 'Por que la alerta sigue activa aunque la estacion mejoro?',
    answer:
      'Porque no usamos solo una foto puntual. Si venia mal durante varias lecturas, puede tardar un poco en salir de alerta. Se limpia cuando la media reciente vuelve a valores normales.',
  },
  {
    id: 'alerta-resuelta-significado',
    category: 'Alertas',
    question: 'Que significa que una alerta salga como resuelta?',
    answer:
      'Significa que ya no supera el umbral en la ventana reciente. Ojo: no siempre implica que la operacion en calle este cerrada; solo indica que el dato actual ya no esta en zona de alerta.',
  },
  {
    id: 'alerta-vacia-llena',
    category: 'Alertas',
    question: 'Que diferencia hay entre alerta de vacia y de llena?',
    answer:
      'Vacia = poca bici para sacar. Llena = pocos anclajes para devolver. En ambos casos hay friccion para la persona usuaria y suele requerir movimiento de flota.',
  },
  {
    id: 'balance-index',
    category: 'Clasificaciones',
    question: 'Que es el Balance Index del sistema?',
    answer:
      'Es una medida de equilibrio global. Compara la ocupacion de cada estacion con el 50%. Si muchas estaciones estan cerca de ese punto, el indice sube. Si muchas estan vacias o llenas, baja.',
  },
  {
    id: 'rotacion-14d',
    category: 'Clasificaciones',
    question: 'Que es la metrica de rotacion 14d?',
    answer:
      'Es un indicador para comparar actividad entre estaciones en los ultimos 14 dias. Cuanto mayor, mas movimiento. Es una puntuacion relativa (ranking), no un numero exacto de viajes.',
  },
  {
    id: 'horas-problema',
    category: 'Clasificaciones',
    question: 'Como se calcula horas problema?',
    answer:
      'Sumamos las horas en las que la estacion estuvo en zona complicada: muy pocas bicis o muy pocos anclajes libres. Cuantas mas horas problema, mas riesgo operativo.',
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
      'Rotacion responde a "donde hay mas movimiento". Criticidad responde a "donde hay mas problemas de disponibilidad". Una estacion puede tener mucha rotacion y poca criticidad, o al reves.',
  },
  {
    id: 'comparar-estaciones',
    category: 'Clasificaciones',
    question: 'Como comparo estaciones de distinto tamano?',
    answer:
      'Para comparar justo, mira primero porcentaje de ocupacion y horas problema. Los valores absolutos (bicis/anclajes) pueden enganar porque una estacion grande siempre mueve mas volumen que una pequena.',
  },
  {
    id: 'proyeccion',
    category: 'Prediccion',
    question: 'La proyeccion de +30/+60 min es un modelo IA?',
    answer:
      'No es una "bola de cristal" ni una lectura real futura. Es una estimacion hecha con lo que suele pasar en esa estacion a esa hora y con su estado reciente.',
  },
  {
    id: 'confianza-prediccion',
    category: 'Prediccion',
    question: 'Que significa el porcentaje de confianza?',
    answer:
      'Es una pista de cuanta fe darle a la prediccion. Si hay buen historico reciente, la confianza sube. Si faltan datos o hay mucho ruido, baja. No es garantia, es orientacion.',
  },
  {
    id: 'prediccion-sin-datos',
    category: 'Prediccion',
    question: 'Por que a veces no hay prediccion o aparece muy plana?',
    answer:
      'Suele pasar cuando hay poco historico, datos irregulares o cambios recientes en la estacion. En esos casos se usa una estimacion mas conservadora y por eso la curva se ve "plana".',
  },
  {
    id: 'prediccion-que-es',
    category: 'Prediccion',
    question: 'Que son exactamente las predicciones del dashboard?',
    answer:
      'Son valores estimados de disponibilidad futura (por ejemplo +30 y +60 min). Se calculan con patrones del pasado + situacion actual. Sirven para anticipar, no para confirmar lo que va a pasar al 100%.',
  },
  {
    id: 'prediccion-uso-practico',
    category: 'Prediccion',
    question: 'Como usar la prediccion en la operativa diaria?',
    answer:
      'Usala como alerta temprana: si una estacion apunta a quedarse sin bicis o sin anclajes en +30/+60 min, adelantate con redistribucion. Es mejor para prevenir que para auditar a posteriori.',
  },
  {
    id: 'matriz-od',
    category: 'Movilidad',
    question: 'La matriz O-D representa viajes reales?',
    answer:
      'No son viajes uno a uno. Es una estimacion agregada por distritos para entender hacia donde parece moverse la demanda en cada franja horaria.',
  },
  {
    id: 'destinos-estimados',
    category: 'Movilidad',
    question: 'Como se obtienen los destinos estimados?',
    answer:
      'Primero vemos cuanto "sale" de cada distrito. Luego repartimos ese flujo entre distritos destino segun el peso de entradas observadas en ese mismo tramo horario.',
  },
  {
    id: 'balance-neto',
    category: 'Movilidad',
    question: 'Que indica un balance neto positivo o negativo?',
    answer:
      'Positivo: entra mas flujo del que sale. Negativo: sale mas del que entra. Te ayuda a ver que barrios "reciben" o "expulsan" demanda en cada periodo.',
  },
  {
    id: 'periodos-flujo',
    category: 'Movilidad',
    question: 'Como cambian los resultados por franja horaria?',
    answer:
      'Cada filtro (mañana, mediodia, tarde, noche) recalcula todo para ese tramo. Por eso una ruta puede ser fuerte por la mañana y casi desaparecer por la noche.',
  },
  {
    id: 'diagrama-chord',
    category: 'Movilidad',
    question: 'Como leer el diagrama chord?',
    answer:
      'Cada bloque es un distrito y cada banda une origen-destino. Banda mas gruesa = mas flujo estimado. Sirve para ver "corredores" de demanda de un vistazo.',
  },
  {
    id: 'calculo-rutas',
    category: 'Movilidad',
    question: 'Como se calculan las rutas estimadas?',
    answer:
      'Tomamos cambios de disponibilidad por hora en estaciones, los agrupamos por distrito y estimamos que parte del flujo va a cada destino segun su peso relativo. Resultado: rutas probables entre zonas, no rutas GPS exactas.',
  },
  {
    id: 'demanda-no-viajes-reales',
    category: 'Movilidad',
    question: 'Demanda significa numero real de viajes?',
    answer:
      'No exactamente. Es un indice para medir "actividad" del sistema. Va muy bien para comparar dias y zonas, pero no debe leerse como contador oficial de viajes cerrados.',
  },
  {
    id: 'movilidad-causalidad',
    category: 'Movilidad',
    question: 'Si dos metricas suben a la vez, significa causa directa?',
    answer:
      'No siempre. El dashboard muestra relaciones utiles para tomar decisiones rapidas, pero correlacion no es prueba de causa. Para causalidad hace falta analisis mas profundo.',
  },
  {
    id: 'historico-balance-data',
    category: 'Datos',
    question: 'Que enseña el historico de equilibrio y demanda?',
    answer:
      'Combina dos lecturas: la demanda agregada y el balance index diario. Asi puedes ver si el sistema mueve mucha actividad pero sigue equilibrado, o si el volumen crece junto con la friccion.',
  },
  {
    id: 'exportaciones',
    category: 'Datos',
    question: 'Que datos puedo exportar desde el modo Data?',
    answer:
      'Puedes descargar el estado actual de estaciones en CSV, el ranking de friccion, el historico agregado con balance, el historico de alertas y el resumen del sistema.',
  },
  {
    id: 'desconectado-frescura',
    category: 'Datos',
    question: 'Cuando aparece que el sistema esta desconectado?',
    answer:
      'Cuando la ultima actualizacion util tiene mas de 10 minutos. Es una forma simple de avisar de que los datos pueden estar atrasados o que la ingesta necesita revisarse.',
  },
  {
    id: 'actualizacion',
    category: 'Datos',
    question: 'Con que frecuencia se actualiza el dashboard?',
    answer:
      'Los datos se refrescan de forma periodica y la API usa cache corta para no saturar consultas. Por eso puede haber unos minutos de diferencia entre una vista y otra.',
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
      'Las causas mas comunes son: estacion nueva, huecos temporales en la recogida o pocas muestras para calcular con fiabilidad. No siempre es fallo; a veces es falta de base suficiente.',
  },
  {
    id: 'desfase-horario',
    category: 'Datos',
    question: 'Por que a veces no coincide la hora exacta con otra app?',
    answer:
      'Puede haber pequenas diferencias por zona horaria mostrada, cache o momento de refresco. Para validar, revisa siempre la marca de "ultima actualizacion" del panel.',
  },
  {
    id: 'busqueda',
    category: 'Uso',
    question: 'Como busco una estacion rapidamente?',
    answer:
      'Puedes buscar por nombre o ID. El buscador ignora mayusculas y acentos para encontrar coincidencias de forma mas flexible.',
  },
  {
    id: 'enlaces-directos-modo',
    category: 'Uso',
    question: 'Hay enlaces directos para abrir un modo concreto del dashboard?',
    answer:
      'Si. Tambien existen rutas directas por modo, como /dashboard/views/operations o /dashboard/views/research. Redirigen al dashboard con el modo correcto ya seleccionado.',
  },
  {
    id: 'mapa-compartible',
    category: 'Uso',
    question: 'Puedo compartir el mapa tal y como lo estoy viendo?',
    answer:
      'Si. La URL guarda el modo, los filtros principales y la posicion del mapa. Asi otra persona puede abrir el mismo contexto de trabajo con bastante precision.',
  },
  {
    id: 'mapa-por-modo',
    category: 'Uso',
    question: 'Por que cambia el mensaje del mapa segun el modo?',
    answer:
      'Porque cada modo tiene un objetivo distinto. En overview el mapa ayuda a entender el estado general. En operations resalta mejor donde conviene intervenir primero.',
  },
  {
    id: 'mapa-friccion-operaciones',
    category: 'Uso',
    question: 'Que significa el halo rojo en el mapa de operaciones?',
    answer:
      'Ese halo resalta estaciones con mas friccion acumulada. Cuanto mayor es, mas tiempo ha pasado la estacion en estados operativamente problematicos, como vacia o llena.',
  },
  {
    id: 'estados-mapa',
    category: 'Uso',
    question: 'Que significan los colores del mapa?',
    answer:
      'Verde indica buena disponibilidad, amarillo nivel intermedio y rojo estado critico respecto a la ocupacion de la estacion.',
  },
  {
    id: 'estaciones-criticas-overview',
    category: 'Uso',
    question: 'Que significa Top estaciones criticas?',
    answer:
      'Es una lista priorizada para actuar rapido. Da mas peso a estaciones vacias o llenas, y despues a las que tienen una ocupacion muy extrema aunque todavia no hayan llegado al limite.',
  },
  {
    id: 'volatilidad-operativa',
    category: 'Movilidad',
    question: 'Que significa volatilidad operativa?',
    answer:
      'Es una forma simple de resumir cuanta inestabilidad hay en la red. Si muchas estaciones pasan una parte alta del tiempo vacias o llenas, la volatilidad sube.',
  },
  {
    id: 'research-snapshots-recientes',
    category: 'Movilidad',
    question: 'Que significa cambio mas visible en memoria?',
    answer:
      'Es una comparacion rapida entre el primer y el ultimo snapshot reciente guardado en el navegador. No sustituye al historico agregado, pero ayuda a ver movimientos inmediatos mientras exploras la vista de analisis.',
  },
  {
    id: 'research-lectura-temporal',
    category: 'Movilidad',
    question: 'Que aporta la lectura temporal rapida en research?',
    answer:
      'Resume de forma sencilla que dia tuvo mas demanda y en que hora suele haber mas bici disponible. Es una puerta de entrada antes de ir a graficos mas detallados.',
  },
  {
    id: 'detalle-estacion',
    category: 'Uso',
    question: 'Cuando debo ir a la pagina de detalle de estacion?',
    answer:
      'Cuando necesites analisis profundo: benchmarking, prediccion temporal, curva horaria y comparativas para una estacion concreta.',
  },
  {
    id: 'estabilidad-estacion',
    category: 'Clasificaciones',
    question: 'Que significa estabilidad por estacion?',
    answer:
      'Resume cuanto tiempo pasa una estacion lejos de un comportamiento sano. Si acumula muchas horas vacia o llena, su estabilidad baja. Sirve para detectar puntos delicados en el tiempo.',
  },
  {
    id: 'predicciones-futuro-endpoint',
    category: 'Datos',
    question: 'Que significa que el sistema ya este preparado para predicciones?',
    answer:
      'Significa que ya existe un endpoint operativo de prediccion y una UI preparada para consumirlo. Ahora mismo estima ocupacion a corto plazo con patrones historicos y estado actual, sin necesidad de rehacer el dashboard.',
  },
  {
    id: 'api-documentacion',
    category: 'Soporte',
    question: 'Hay endpoints API para integrar estos datos?',
    answer:
      'Si. El proyecto expone endpoints para estado, estaciones, alertas, rankings, patrones, heatmap, movilidad, historico y predicciones por estacion. El modo Data resume los principales formatos y rutas.',
  },
  {
    id: 'contacto-soporte',
    category: 'Soporte',
    question: 'Como reporto una incidencia de datos?',
    answer:
      'Incluye estacion, hora aproximada, vista donde aparece el problema y una captura. Con ese contexto se acelera la revision tecnica.',
  },
];

const CATEGORY_PRIORITY_MAP = new Map<string, number>(
  CATEGORY_PRIORITY.map((category, index) => [category, index])
);

const FAQ_PRIORITY_MAP = new Map<string, number>(
  FAQ_PRIORITY_IDS.map((faqId, index) => [faqId, index])
);

const FAQ_INDEX_MAP = new Map<string, number>(
  FAQ_ITEMS.map((item, index) => [item.id, index])
);

function compareCategories(a: string, b: string): number {
  const rankA = CATEGORY_PRIORITY_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
  const rankB = CATEGORY_PRIORITY_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return a.localeCompare(b, 'es-ES');
}

function compareFaqItems(a: FaqItem, b: FaqItem): number {
  const rankA = FAQ_PRIORITY_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
  const rankB = FAQ_PRIORITY_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const originalA = FAQ_INDEX_MAP.get(a.id) ?? Number.MAX_SAFE_INTEGER;
  const originalB = FAQ_INDEX_MAP.get(b.id) ?? Number.MAX_SAFE_INTEGER;

  return originalA - originalB;
}

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');
  const [historyMeta, setHistoryMeta] = useState<HistoryApiResponse | null>(null);

  const normalizedQuery = useMemo(() => normalize(query), [query]);

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      if (activeCategory && item.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = normalize(`${item.category} ${item.question} ${item.answer}`);
      return searchable.includes(normalizedQuery);
    });
  }, [activeCategory, normalizedQuery]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(FAQ_ITEMS.map((item) => item.category));
    return Array.from(uniqueCategories.values()).sort(compareCategories);
  }, []);

  const groupedItems = useMemo(() => {
    const sortedItems = [...filteredItems].sort((a, b) => {
      const categoryDiff = compareCategories(a.category, b.category);

      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      return compareFaqItems(a, b);
    });

    const map = new Map<string, FaqItem[]>();

    for (const item of sortedItems) {
      const rows = map.get(item.category) ?? [];
      rows.push(item);
      map.set(item.category, rows);
    }

    return Array.from(map.entries());
  }, [filteredItems]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of FAQ_ITEMS) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }

    return counts;
  }, []);

  const categoryMatchesBySearch = useMemo(() => {
    const counts = new Map<string, number>();

    for (const category of categories) {
      counts.set(category, 0);
    }

    for (const item of FAQ_ITEMS) {
      if (!normalizedQuery) {
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
        continue;
      }

      const searchable = normalize(`${item.category} ${item.question} ${item.answer}`);

      if (searchable.includes(normalizedQuery)) {
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      }
    }

    return counts;
  }, [categories, normalizedQuery]);

  const faqStructuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }),
    []
  );

  const showFilteredCount = normalizedQuery.length > 0 || activeCategory !== null;

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

        captureExceptionWithContext(error, {
          area: 'dashboard.help-center',
          operation: 'loadHistoryMeta',
        });
        console.error('[Ayuda] No se pudo cargar metadata historica.', error);
      }
    };

    void loadHistoryMeta();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setOpenItemId('');
      return;
    }

    if (filteredItems.some((item) => item.id === openItemId)) {
      return;
    }

    setOpenItemId(filteredItems[0]?.id ?? '');
  }, [filteredItems, openItemId]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                B
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Bizi Zaragoza</h2>
            </div>
            <DashboardRouteLinks
              activeRoute="help"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-6 md:flex"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <label htmlFor="help-search-desktop" className="hidden items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 sm:flex">
              <span className="sr-only">Buscar ayuda o preguntas frecuentes</span>
              <input
                id="help-search-desktop"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-44 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Buscar ayuda..."
              />
            </label>
            <DashboardRouteLinks
              activeRoute="help"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <Link href="/api/history" className="icon-button">
              Historico
            </Link>
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <label htmlFor="help-search-mobile" className="mb-6 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm sm:hidden">
          <span className="sr-only">Buscar ayuda o preguntas frecuentes</span>
          <input
            id="help-search-mobile"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Buscar ayuda..."
          />
        </label>

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
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
                {filteredItems.length} preguntas visibles
              </span>
              {activeCategory ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                >
                  Categoria: {activeCategory} ×
                </button>
              ) : null}
              {normalizedQuery ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Buscar: {query} ×
                </button>
              ) : null}
            </div>
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
              <Link
                href="/api/history"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
              >
                Ver historico completo
              </Link>
              <Link
                href="/api/openapi.json"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Definicion API
              </Link>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const isCategoryFilterActive = activeCategory === category;
            const categoryMatches = categoryMatchesBySearch.get(category) ?? 0;
            const totalInCategory = categoryCounts.get(category) ?? 0;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory((currentCategory) => (currentCategory === category ? null : category))}
                aria-pressed={isCategoryFilterActive}
                className={`rounded-xl border bg-[var(--surface)] p-6 text-left transition hover:border-[var(--accent)] ${
                  isCategoryFilterActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/6 shadow-[0_0_0_1px_var(--accent-soft)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-xl font-black text-[var(--accent)]">
                    {category.slice(0, 1)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isCategoryFilterActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]'
                  }`}>
                    {categoryMatches}/{totalInCategory}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">{category}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {showFilteredCount
                    ? `${categoryMatches} de ${totalInCategory} preguntas coinciden.`
                    : `${totalInCategory} preguntas disponibles.`}
                </p>
              </button>
            );
          })}
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
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]">
                    {items.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {items.map((item) => {
                    const isOpen = openItemId === item.id;
                    const buttonId = `faq-button-${item.id}`;
                    const panelId = `faq-panel-${item.id}`;

                    return (
                      <article key={item.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <button
                          id={buttonId}
                          type="button"
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                          onClick={() => setOpenItemId((current) => (current === item.id ? '' : item.id))}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                        >
                          <p className="text-base font-semibold text-[var(--foreground)]">{item.question}</p>
                          <span className="text-lg font-bold text-[var(--muted)]">{isOpen ? '-' : '+'}</span>
                        </button>
                        {isOpen ? (
                          <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]">
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
              Si necesitas soporte directo o quieres compartir feedback, puedes escribirnos y consultar el historico agregado disponible.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/in/guillermocastella/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white"
            >
              Contacto
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
