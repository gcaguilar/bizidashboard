type StructuredDataListEntry = {
  name: string;
  url: string;
};

/**
 * Serializa JSON-LD para inyectar en `<script type="application/ld+json">`
 * via `dangerouslySetInnerHTML`. Escapa `<`, `>`, `&` y U+2028/U+2029 para
 * que un valor con `</script>` nunca pueda romper el bloque de script.
 */
export function toJsonLdScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildItemListStructuredData(
  name: string,
  entries: StructuredDataListEntry[]
) {
  return {
    '@type': 'ItemList',
    name,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      url: entry.url,
    })),
  };
}
