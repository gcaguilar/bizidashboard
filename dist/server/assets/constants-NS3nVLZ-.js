//#region src/lib/constants.ts
var CITIES = [
	"zaragoza",
	"madrid",
	"barcelona"
];
var CITY_CONFIGS = {
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
var DEFAULT_CITY = "zaragoza";
function isValidCity(value) {
	return CITIES.includes(value);
}
//#endregion
export { DEFAULT_CITY as n, isValidCity as r, CITY_CONFIGS as t };

//# sourceMappingURL=constants-NS3nVLZ-.js.map