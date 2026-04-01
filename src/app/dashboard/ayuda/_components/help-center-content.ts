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
  'Prediccion',
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
    question: 'Que ventana usa la analitica principal?',
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
      `Si. Tambien existen rutas directas por modo, como ${appRoutes.dashboardView('operations')} o ${appRoutes.dashboardView('research')}. Redirigen al dashboard con el modo correcto ya seleccionado.`,
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
