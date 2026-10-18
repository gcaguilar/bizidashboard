/**
 * Paleta categórica accesible para gráficos con muchas categorías (barrios,
 * distritos, corredores). Antes, la "Carga por barrio" usaba un único tono rojo
 * con rampa de opacidad, de modo que los 16 distritos resultaban
 * indistinguibles. Estos colores son distintos entre sí, mantienen contraste
 * razonable sobre fondo claro y oscuro, y el orden es estable: un mismo índice
 * conserva su color entre el gráfico y la leyenda.
 */
export const CATEGORICAL_PALETTE = [
  '#0f766e', // verde azulado
  '#b45309', // ámbar oscuro
  '#1d4ed8', // azul
  '#9d174d', // magenta
  '#4d7c0f', // verde oliva
  '#7c3aed', // violeta
  '#0e7490', // cian oscuro
  '#b91c1c', // rojo
  '#a16207', // amarillo oscuro
  '#2563eb', // azul vivo
  '#be185d', // rosa
  '#15803d', // verde
  '#6d28d9', // púrpura
  '#c2410c', // naranja
  '#0369a1', // azul cielo oscuro
  '#854d0e', // marrón
  '#4338ca', // índigo
  '#a21caf', // fucsia
  '#166534', // verde profundo
  '#9f1239', // rojo rosado
] as const;

export function getCategoricalColor(index: number): string {
  if (!Number.isFinite(index) || index < 0) {
    return CATEGORICAL_PALETTE[0];
  }

  return CATEGORICAL_PALETTE[Math.floor(index) % CATEGORICAL_PALETTE.length];
}
