/**
 * One dictionary area: Spanish is the source of truth, English is a partial of
 * the Spanish keys (a missing key falls back to Spanish at runtime; a key that
 * does not exist in Spanish is a type error).
 */
export type MessageArea<ES extends Record<string, string>> = {
  es: ES;
  en: Partial<Record<keyof ES, string>>;
};

export function defineArea<const ES extends Record<string, string>>(
  area: MessageArea<ES>,
): MessageArea<ES> {
  return area;
}
