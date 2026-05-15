import { i as isDistrictCollection, s as parseJsonWithGuard, t as DISTRICTS_GEOJSON_URL } from "./districts-DMcc_jOx.js";
import path from "node:path";
import { readFile } from "node:fs/promises";
//#region src/lib/districts.server.ts
var districtCollectionCache = null;
var districtCollectionPromise = null;
async function loadDistrictCollectionFromFile() {
	return parseJsonWithGuard(await readFile(path.join(process.cwd(), "public", DISTRICTS_GEOJSON_URL.replace(/^\/+/, "")), "utf8"), isDistrictCollection);
}
async function fetchDistrictCollection() {
	if (districtCollectionCache) return districtCollectionCache;
	if (!districtCollectionPromise) districtCollectionPromise = loadDistrictCollectionFromFile().then((collection) => {
		districtCollectionCache = collection;
		return collection;
	}).catch((error) => {
		districtCollectionPromise = null;
		throw error;
	});
	return districtCollectionPromise;
}
//#endregion
export { fetchDistrictCollection as t };

//# sourceMappingURL=districts.server-Qiyl6lhv.js.map