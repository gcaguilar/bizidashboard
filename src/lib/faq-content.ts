import { appRoutes } from '@/lib/routes'

export type FaqItem = {
  question: string
  answer: string
  href?: string
  linkLabel?: string
}

/**
 * Respuestas directas y estables para AEO. Las cifras de red llevan fecha y
 * siempre remiten a la página viva para que el dato no se quede obsoleto.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué es DatosBizi?',
    answer:
      'DatosBizi es un observatorio público e independiente de Bizi Zaragoza. Reúne disponibilidad en vivo, histórico, barrios, informes mensuales y una API de datos abiertos. No es la web oficial del servicio ni su operador.',
    href: appRoutes.about(),
    linkLabel: 'Sobre el proyecto',
  },
  {
    question: '¿DatosBizi es la web oficial de Bizi Zaragoza?',
    answer:
      'No. DatosBizi es un proyecto independiente que reutiliza el feed público GBFS de Bizi Zaragoza. Para altas, abonos, pagos o incidencias del servicio hay que acudir a la web oficial de Bizi.',
    href: appRoutes.avisoLegal(),
    linkLabel: 'Aviso legal',
  },
  {
    question: '¿Cuántas estaciones tiene Bizi Zaragoza?',
    answer:
      'A 20 de octubre de 2026, la red tenía 276 estaciones operativas. El número puede variar con el mantenimiento o las ampliaciones; consulta el directorio actualizado para ver el dato de hoy.',
    href: appRoutes.cuantasEstaciones(),
    linkLabel: 'Ver el dato actualizado',
  },
  {
    question: '¿Cuántas bicis hay disponibles ahora en Bizi Zaragoza?',
    answer:
      'A las 14:19 del 20 de octubre de 2026 había 1.154 bicis y 4.221 anclajes libres. Es un dato vivo: cambia cada pocos minutos. Consulta la portada o el directorio de estaciones para el valor actual.',
    href: appRoutes.dondeHayBici(),
    linkLabel: 'Consultar disponibilidad',
  },
  {
    question: '¿Dónde hay bicis y huecos libres en Zaragoza?',
    answer:
      'Puedes consultarlo en el mapa y el directorio de estaciones de DatosBizi, filtrando por «con bicis» o «con huecos». BiciRadar permite además ver las estaciones cercanas a tu ubicación y guardar favoritas.',
    href: appRoutes.dondeHayBici(),
    linkLabel: 'Dónde hay bici',
  },
  {
    question: '¿Cada cuánto se actualizan los datos?',
    answer:
      'El sistema oficial se sondea aproximadamente cada 2 minutos. La interfaz puede mostrar unos minutos de retraso por la caché. En la página de Estado puedes comprobar la hora exacta de la última muestra.',
    href: appRoutes.status(),
    linkLabel: 'Ver estado de los datos',
  },
  {
    question: '¿De dónde salen los datos de DatosBizi?',
    answer:
      'La fuente principal es el feed GBFS oficial de Bizi Zaragoza. DatosBizi valida, agrega y publica esos datos; no los genera ni modifica el servicio. La metodología explica cada métrica y sus límites.',
    href: appRoutes.methodology(),
    linkLabel: 'Leer la metodología',
  },
  {
    question: '¿Los datos de viajes son oficiales?',
    answer:
      'No. El «índice de actividad» sirve para comparar estaciones, barrios y meses. No equivale al número oficial de viajes cerrados ni a un contador de trayectos individuales.',
    href: appRoutes.methodology(),
    linkLabel: 'Cómo se calcula',
  },
  {
    question: '¿Qué es el índice de actividad?',
    answer:
      'Es una puntuación relativa que resume cuánta actividad detectamos en una estación o zona. Cuanto mayor es, más movimiento. Sirve para comparar, no para afirmar cuántos viajes se hicieron.',
    href: appRoutes.statsViajes(),
    linkLabel: 'Ver actividad y viajes',
  },
  {
    question: '¿Qué es la ocupación media de una estación?',
    answer:
      'Es el porcentaje medio de anclajes ocupados por bicis en un periodo. Una ocupación muy alta indica riesgo de quedarse sin huecos; una muy baja, riesgo de quedarse sin bicis. Se calcula con muchas muestras, no con una foto puntual.',
    href: appRoutes.statsEstaciones(),
    linkLabel: 'Ver estaciones',
  },
  {
    question: '¿Hay una API pública de Bizi Zaragoza?',
    answer:
      'Sí. DatosBizi publica una API de lectura con endpoints de estado, estaciones, rankings, movilidad, histórico y alertas, además de descargas CSV y un documento OpenAPI 0.5.0. Es gratuita para consultas razonables.',
    href: appRoutes.developers(),
    linkLabel: 'Ver API y datos',
  },
  {
    question: '¿Qué app puedo usar para ver bicis públicas en Zaragoza?',
    answer:
      'BiciRadar es una app gratuita y sin publicidad para consultar estaciones cercanas, bicis y huecos en Zaragoza, Madrid, Barcelona, Valencia y Sevilla. También puedes usar la web de DatosBizi sin instalar nada.',
    href: appRoutes.queAppBiciPublica(),
    linkLabel: 'Comparar opciones',
  },
  {
    question: '¿Cuánto cuesta Bizi Zaragoza?',
    answer:
      'DatosBizi es gratuito y no vende abonos ni gestiona altas. Las tarifas y condiciones del servicio las fija el operador de Bizi Zaragoza; consúltalas en la web oficial. Aquí no publicamos precios para no dar información desactualizada.',
  },
  {
    question: '¿Qué hago si la estación está llena o vacía?',
    answer:
      'Consulta las estaciones cercanas con huecos o bicis, usa las favoritas y activa alertas en BiciRadar. En DatosBizi puedes revisar la fricción histórica de cada estación para saber qué alternativa suele funcionar mejor.',
    href: appRoutes.statsRedistribucion(),
    linkLabel: 'Ver estaciones con fricción',
  },
  {
    question: '¿Cómo puedo citar DatosBizi o reportar un error?',
    answer:
      'Cita «DatosBizi (2026), observatorio independiente de Bizi Zaragoza, consultado el [fecha]» e incluye la URL. Para correcciones, indica la URL, la estación y la hora; puedes usar el formulario de contacto o GitHub Issues.',
    href: appRoutes.contacto(),
    linkLabel: 'Contacto y correcciones',
  },
]

export const FAQ_QUICK_LINKS = [
  { label: 'Cuántas estaciones hay', href: appRoutes.cuantasEstaciones() },
  { label: 'Dónde hay bici ahora', href: appRoutes.dondeHayBici() },
  { label: 'Cómo funciona Bizi', href: appRoutes.comoFuncionaBizi() },
  { label: 'Qué app usar', href: appRoutes.queAppBiciPublica() },
] as const
