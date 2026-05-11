import { t as __esmMin } from "./chunk-D3Uyr3oi.js";
//#region src/lib/constants.ts
function isValidCity(value) {
	return CITIES.includes(value);
}
var CITIES, CITY_CONFIGS, DEFAULT_CITY;
var init_constants = __esmMin((() => {
	CITIES = [
		"zaragoza",
		"madrid",
		"barcelona"
	];
	CITY_CONFIGS = {
		zaragoza: {
			name: "Zaragoza",
			gbfsUrl: "https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json"
		},
		madrid: {
			name: "Madrid",
			gbfsUrl: "https://madrid.publicbikesystem.net/customer/gbfs/v2/gbfs.json"
		},
		barcelona: {
			name: "Barcelona",
			gbfsUrl: "https://barcelona-sp.publicbikesystem.net/customer/gbfs/v2/gbfs.json"
		}
	};
	DEFAULT_CITY = "zaragoza";
}));
//#endregion
export { isValidCity as i, DEFAULT_CITY as n, init_constants as r, CITY_CONFIGS as t };
