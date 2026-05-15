//#region src/lib/timezone.ts
var TIMEZONE = "Europe/Madrid";
new Intl.DateTimeFormat("en-GB", {
	timeZone: TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23"
});
new Intl.DateTimeFormat("en-GB", {
	timeZone: TIMEZONE,
	timeZoneName: "shortOffset",
	hour: "2-digit",
	minute: "2-digit"
});
//#endregion
export { TIMEZONE as t };

//# sourceMappingURL=timezone-DIvdn6H4.js.map