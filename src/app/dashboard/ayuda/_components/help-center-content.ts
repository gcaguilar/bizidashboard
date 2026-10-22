import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';
import { appRoutes } from '@/lib/routes';

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const CATEGORY_PRIORITY = [
  'Alertas',
  'Predicción',
  'Movilidad',
  'Clasificaciones',
  'Datos',
  'Uso',
  'Soporte',
] as const;

export const FAQ_PRIORITY_IDS = [
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

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'alertas-activas',
    category: 'Alertas',
    question: '¿Cuándo una estación entra en alerta?',
    answer: `Miramos las últimas ${ANALYTICS_WINDOWS.alertWindowHours} horas (no solo el último minuto). Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, la estación entra en alerta.`,
  },
  {
    id: 'severidad-alertas',
    category: 'Alertas',
    question: '¿Qué significa una alerta crítica?',
    answer:
      'Tenemos dos niveles: severidad 1 (media) y severidad 2 (crítica). Crítica significa que la situación es más urgente y esa estación suele ir primero en la cola de redistribución.',
  },
  {
    id: 'alerta-persistente',
    category: 'Alertas',
    question: '¿Por qué la alerta sigue activa aunque la estación mejoró?',
    answer:
      'Porque no usamos solo una foto puntual. Si venia mal durante varias lecturas, puede tardar un poco en salir de alerta. Se limpia cuando la media reciente vuelve a valores normales.',
  },
  {
    id: 'alerta-resuelta-significado',
    category: 'Alertas',
    question: '¿Qué significa que una alerta salga como resuelta?',
    answer:
      'Significa que ya no supera el umbral en la ventana reciente. Ojo: no siempre implica que la operación en calle este cerrada; solo indica que el dato actual ya no esta en zona de alerta.',
  },
  {
    id: 'alerta-vacia-llena',
    category: 'Alertas',
    question: '¿Qué diferencia hay entre alerta de vacía y de llena?',
    answer:
      'Vacía = poca bici para sacar. Llena = pocos anclajes para devolver. En ambos casos hay fricción para la persona usuaria y suele requerir movimiento de flota.',
  },
  {
    id: 'balance-index',
    category: 'Clasificaciones',
    question: '¿Qué es el Balance Index del sistema?',
    answer:
      'Es una medida de equilibrio global. Compara la ocupación de cada estación con el 50%. Si muchas estaciones estan cerca de ese punto, el índice sube. Si muchas estan vacías o llenas, baja.',
  },
  {
    id: 'rotacion-14d',
    category: 'Clasificaciones',
    question: '¿Qué es la métrica de rotación 14d?',
    answer:
      'Es un indicador para comparar actividad entre estaciones en los últimos 14 días. Cuanto mayor, más movimiento. Es una puntuacion relativa (ranking), no un número exacto de viajes.',
  },
  {
    id: 'horas-problema',
    category: 'Clasificaciones',
    question: '¿Cómo se calcula horas problema?',
    answer:
      'Sumamos las horas en las que la estación estuvo en zona complicada: muy pocas bicis o muy pocos anclajes libres. Cuantas más horas problema, más riesgo operativo.',
  },
  {
    id: 'ranking-no-aparece',
    category: 'Clasificaciones',
    question: '¿Por qué una estación no aparece en el ranking?',
    answer:
      'Puede no aparecer por falta de datos suficientes en la ventana analítica o porque queda fuera del límite de resultados mostrados.',
  },
  {
    id: 'ranking-rotacion-vs-criticidad',
    category: 'Clasificaciones',
    question: '¿Qué diferencia hay entre rotación y criticidad?',
    answer:
      'Rotación responde a "donde hay más movimiento". Criticidad responde a "donde hay más problemas de disponibilidad". Una estación puede tener mucha rotación y poca criticidad, o al reves.',
  },
  {
    id: 'comparar-estaciones',
    category: 'Clasificaciones',
    question: '¿Cómo comparo estaciones de distinto tamaño?',
    answer:
      'Para comparar justo, mira primero porcentaje de ocupación y horas problema. Los valores absolutos (bicis/anclajes) pueden enganar porque una estación grande siempre mueve más volumen que una pequena.',
  },
  {
    id: 'proyeccion',
    category: 'Predicción',
    question: '¿La proyección de +30/+60 min es un modelo IA?',
    answer:
      'No es una "bola de cristal" ni una lectura real futura. Es una estimación hecha con lo que suele pasar en esa estación a esa hora y con su estado reciente.',
  },
  {
    id: 'confianza-prediccion',
    category: 'Predicción',
    question: '¿Qué significa el porcentaje de confianza?',
    answer:
      'Es una pista de cuanta fe darle a la predicción. Si hay buen histórico reciente, la confianza sube. Si faltan datos o hay mucho ruido, baja. No es garantia, es orientacion.',
  },
  {
    id: 'prediccion-sin-datos',
    category: 'Predicción',
    question: '¿Por qué a veces no hay predicción o aparece muy plana?',
    answer:
      'Suele pasar cuando hay poco histórico, datos irregulares o cambios recientes en la estación. En esos casos se usa una estimación más conservadora y por eso la curva se ve "plana".',
  },
  {
    id: 'prediccion-que-es',
    category: 'Predicción',
    question: '¿Qué son exactamente las predicciones del dashboard?',
    answer:
      'Son valores estimados de disponibilidad futura (por ejemplo +30 y +60 min). Se calculan con patrones del pasado y la situación actual. Sirven para anticipar, no para confirmar lo que va a pasar al 100%.',
  },
  {
    id: 'prediccion-uso-practico',
    category: 'Predicción',
    question: '¿Cómo usar la predicción en la operativa diaria?',
    answer:
      'Usala como alerta temprana: si una estación apunta a quedarse sin bicis o sin anclajes en +30/+60 min, adelantate con redistribución. Es mejor para prevenir que para auditar a posteriori.',
  },
  {
    id: 'matriz-od',
    category: 'Movilidad',
    question: '¿La matriz O-D representa viajes reales?',
    answer:
      'No son viajes uno a uno ni un registro oficial. Es una estimación agregada por distritos para entender hacia dónde parece moverse la demanda en cada franja horaria.',
  },
  {
    id: 'destinos-estimados',
    category: 'Movilidad',
    question: '¿Cómo se obtienen los destinos estimados?',
    answer:
      'Primero vemos cuanto "sale" de cada distrito. Luego repartimos ese flujo entre distritos destino según el peso de entradas observadas en ese mismo tramo horario.',
  },
  {
    id: 'balance-neto',
    category: 'Movilidad',
    question: '¿Qué indica un balance neto positivo o negativo?',
    answer:
      'Positivo: entra más flujo del que sale. Negativo: sale más del que entra. Te ayuda a ver que barrios "reciben" o "expulsan" demanda en cada periodo.',
  },
  {
    id: 'periodos-flujo',
    category: 'Movilidad',
    question: '¿Cómo cambian los resultados por franja horaria?',
    answer:
      'Cada filtro (mañana, mediodia, tarde, noche) recalcula todo para ese tramo. Por eso una ruta puede ser fuerte por la mañana y casi desaparecer por la noche.',
  },
  {
    id: 'diagrama-chord',
    category: 'Movilidad',
    question: '¿Cómo leer el diagrama chord?',
    answer:
      'Cada bloque es un distrito y cada banda une origen-destino. Banda más gruesa = más flujo estimado. Sirve para ver "corredores" de demanda de un vistazo.',
  },
  {
    id: 'calculo-rutas',
    category: 'Movilidad',
    question: '¿Cómo se calculan las rutas estimadas?',
    answer:
      'Tomamos cambios de disponibilidad por hora en estaciones, los agrupamos por distrito y estimamos que parte del flujo va a cada destino según su peso relativo. Resultado: rutas probables entre zonas, no rutas GPS exactas.',
  },
  {
    id: 'demanda-no-viajes-reales',
    category: 'Movilidad',
    question: '¿La demanda significa número real de viajes?',
    answer:
      'No exactamente. Es un índice para medir la actividad del sistema. Va muy bien para comparar días y zonas, pero no debe leerse como contador oficial de viajes cerrados.',
  },
  {
    id: 'movilidad-causalidad',
    category: 'Movilidad',
    question: '¿Si dos métricas suben a la vez, significa causa directa?',
    answer:
      'No siempre. El dashboard muestra relaciones útiles para tomar decisiones rápidas, pero correlación no es prueba de causa. Para causalidad hace falta análisis más profundo.',
  },
  {
    id: 'historico-balance-data',
    category: 'Datos',
    question: '¿Qué enseña el histórico de equilibrio y demanda?',
    answer:
      'Combina dos lecturas: la demanda agregada y el balance index diario. Asi puedes ver si el sistema mueve mucha actividad pero sigue equilibrado, o si el volumen crece junto con la fricción.',
  },
  {
    id: 'exportaciones',
    category: 'Datos',
    question: '¿Qué datos puedo exportar desde el modo Data?',
    answer:
      'Puedes descargar el estado actual de estaciones en CSV, el ranking de fricción, el histórico agregado con balance, el histórico de alertas y el resumen del sistema.',
  },
  {
    id: 'desconectado-frescura',
    category: 'Datos',
    question: '¿Cuándo aparece que el sistema está desconectado?',
    answer:
      'Cuando la última actualización útil tiene más de 10 minutos. Es una forma simple de avisar de que los datos pueden estar atrasados o que la ingesta necesita revisarse.',
  },
  {
    id: 'actualizacion',
    category: 'Datos',
    question: '¿Con qué frecuencia se actualiza el dashboard?',
    answer:
      'Los datos se refrescan de forma periódica y la API usa caché corta para no saturar consultas. Por eso puede haber unos minutos de diferencia entre una vista y otra.',
  },
  {
    id: 'ventana-analitica',
    category: 'Datos',
    question: '¿Qué ventana usa la analítica principal?',
    answer:
      `Los rankings usan una ventana de ${ANALYTICS_WINDOWS.rankingDays} días y las alertas se calculan sobre ${ANALYTICS_WINDOWS.alertWindowHours} horas moviles.`,
  },
  {
    id: 'fuente-datos',
    category: 'Datos',
    question: '¿De dónde salen los datos de estaciones?',
    answer:
      'La fuente principal es el feed GBFS oficial de Bizi Zaragoza: https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json. A partir de ese discovery se consultan station_information y station_status de forma periódica, y luego se validan y agregan para analítica.',
  },
  {
    id: 'sin-datos',
    category: 'Datos',
    question: '¿Por qué a veces aparece "sin datos"?',
    answer:
      'Las causas más comunes son: estación nueva, huecos temporales en la recogida o pocas muestras para calcular con fiabilidad. No siempre es fallo; a veces es falta de base suficiente.',
  },
  {
    id: 'desfase-horario',
    category: 'Datos',
    question: '¿Por qué a veces no coincide la hora exacta con otra app?',
    answer:
      'Puede haber pequenas diferencias por zona horaria mostrada, cache o momento de refresco. Para validar, revisa siempre la marca de "última actualización" del panel.',
  },
  {
    id: 'busqueda',
    category: 'Uso',
    question: '¿Cómo busco una estación rápidamente?',
    answer:
      'Puedes buscar por nombre o ID. El buscador ignora mayusculas y acentos para encontrar coincidencias de forma más flexible.',
  },
  {
    id: 'enlaces-directos-modo',
    category: 'Uso',
    question: '¿Hay enlaces directos para abrir un modo concreto del dashboard?',
    answer:
      `Si. Tambien existen rutas directas por modo, como ${appRoutes.dashboardView('operations')} o ${appRoutes.dashboardView('research')}. Redirigen al dashboard con el modo correcto ya seleccionado.`,
  },
  {
    id: 'mapa-compartible',
    category: 'Uso',
    question: '¿Puedo compartir el mapa tal y como lo estoy viendo?',
    answer:
      'Si. La URL guarda el modo, los filtros principales y la posición del mapa. Asi otra persona puede abrir el mismo contexto de trabajo con bastante precision.',
  },
  {
    id: 'mapa-por-modo',
    category: 'Uso',
    question: '¿Por qué cambia el mensaje del mapa según el modo?',
    answer:
      'Porque cada modo tiene un objetivo distinto. En overview el mapa ayuda a entender el estado general. En operations resalta mejor donde conviene intervenir primero.',
  },
  {
    id: 'mapa-friccion-operaciones',
    category: 'Uso',
    question: '¿Qué significa el halo rojo en el mapa de operaciones?',
    answer:
      'Ese halo resalta estaciones con más fricción acumulada. Cuanto mayor es, más tiempo ha pasado la estación en estados operativamente problematicos, como vacía o llena.',
  },
  {
    id: 'estados-mapa',
    category: 'Uso',
    question: '¿Qué significan los colores del mapa?',
    answer:
      'Verde indica buena disponibilidad, amarillo nivel intermedio y rojo estado crítico respecto a la ocupación de la estación.',
  },
  {
    id: 'estaciones-criticas-overview',
    category: 'Uso',
    question: '¿Qué significa Top estaciones críticas?',
    answer:
      'Es una lista priorizada para actuar rápido. Da más peso a estaciones vacías o llenas, y después a las que tienen una ocupación muy extrema aunque todavía no hayan llegado al límite.',
  },
  {
    id: 'volatilidad-operativa',
    category: 'Movilidad',
    question: '¿Qué significa volatilidad operativa?',
    answer:
      'Es una forma simple de resumir cuanta inestabilidad hay en la red. Si muchas estaciones pasan una parte alta del tiempo vacías o llenas, la volatilidad sube.',
  },
  {
    id: 'research-snapshots-recientes',
    category: 'Movilidad',
    question: '¿Qué significa cambio más visible en memoria?',
    answer:
      'Es una comparación rápida entre el primer y el último snapshot reciente guardado en el navegador. No sustituye al histórico agregado, pero ayuda a ver movimientos inmediatos mientras exploras la vista de análisis.',
  },
  {
    id: 'research-lectura-temporal',
    category: 'Movilidad',
    question: '¿Qué aporta la lectura temporal rápida en research?',
    answer:
      'Resume de forma sencilla que día tuvo más demanda y en que hora suele haber más bici disponible. Es una puerta de entrada antes de ir a gráficos más detallados.',
  },
  {
    id: 'detalle-estacion',
    category: 'Uso',
    question: '¿Cuándo debo ir a la página de detalle de estación?',
    answer:
      'Cuando necesites análisis profundo: benchmarking, predicción temporal, curva horaria y comparativas para una estación concreta.',
  },
  {
    id: 'estabilidad-estacion',
    category: 'Clasificaciones',
    question: '¿Qué significa estabilidad por estación?',
    answer:
      'Resume cuanto tiempo pasa una estación lejos de un comportamiento sano. Si acumula muchas horas vacía o llena, su estabilidad baja. Sirve para detectar puntos delicados en el tiempo.',
  },
  {
    id: 'predicciones-futuro-endpoint',
    category: 'Datos',
    question: '¿Qué significa que el sistema ya esté preparado para predicciones?',
    answer:
      'Significa que ya existe un endpoint operativo de predicción y una UI preparada para consumirlo. Ahora mismo estima ocupación a corto plazo con patrones históricos y estado actual, sin necesidad de rehacer el dashboard.',
  },
  {
    id: 'api-documentacion',
    category: 'Soporte',
    question: '¿Hay endpoints API para integrar estos datos?',
    answer:
      'Si. El proyecto expone endpoints para estado, estaciones, alertas, rankings, patrones, heatmap, movilidad, histórico y predicciones por estación. El modo Data resume los principales formatos y rutas.',
  },
  {
    id: 'contacto-soporte',
    category: 'Soporte',
    question: '¿Cómo reporto una incidencia de datos?',
    answer:
      'Incluye estación, hora aproximada, vista donde aparece el problema y una captura. Con ese contexto se acelera la revisión técnica.',
  },
];
