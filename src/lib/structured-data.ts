type StructuredDataListEntry = {
  name: string;
  url: string;
};

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
