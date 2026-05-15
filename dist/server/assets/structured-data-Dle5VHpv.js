//#region src/lib/structured-data.ts
function buildItemListStructuredData(name, entries) {
	return {
		"@type": "ItemList",
		name,
		itemListElement: entries.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: entry.name,
			url: entry.url
		}))
	};
}
//#endregion
export { buildItemListStructuredData as t };

//# sourceMappingURL=structured-data-Dle5VHpv.js.map