import{a as e,i as t,l as n,u as r}from"./cache-DlqjBR7D.js";import{i}from"./types-BEmL6aMJ.js";import{t as a}from"./logger-FU5Zip2J.js";var o=r(),s=`Europe/Madrid`;new Intl.DateTimeFormat(`en-GB`,{timeZone:s,year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hourCycle:`h23`}),new Intl.DateTimeFormat(`en-GB`,{timeZone:s,timeZoneName:`shortOffset`,hour:`2-digit`,minute:`2-digit`});var c=new Intl.DateTimeFormat(`en-GB`,{timeZone:s,weekday:`short`,hour:`2-digit`,hourCycle:`h23`}),l={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6},u=e=>!Number.isNaN(e.getTime()),d=(e,t)=>e.find(e=>e.type===t)?.value??``;function f(e){if(!u(e))return NaN;let t=d(c.formatToParts(e),`hour`);return Number.parseInt(t,10)}function p(e){return u(e)?l[d(c.formatToParts(e),`weekday`)]??NaN:NaN}function m(e){let t=p(e);return Number.isNaN(t)?i.WEEKDAY:t===0||t===6?i.WEEKEND:i.WEEKDAY}function h(e){return{hour:f(e),dayOfWeek:p(e),dayType:m(e)}}var g=[`bucketStart`,`bucketDate`,`recordedAt`];function _(n,r,i){if(!g.includes(n))throw Error(`Invalid column name: ${n}`);if(i&&e(i)){let{start:e,endExclusive:r}=t(i);return o.Prisma.sql`${o.Prisma.raw(`"${n}"`)} >= ${e}::timestamp AND ${o.Prisma.raw(`"${n}"`)} < ${r}::timestamp`}let a=Math.max(1,Math.min(365,Math.floor(r)));return o.Prisma.sql`${o.Prisma.raw(`"${n}"`)} >= NOW() - INTERVAL '1 day' * ${a}`}function v(n,r){if(r&&e(r)){let{start:e,endExclusive:n}=t(r);return o.Prisma.sql`
      WITH date_series AS (
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
        FROM generate_series(${e}::timestamp, (${n}::timestamp - INTERVAL '1 day'), '1 day'::interval) AS day
      ),
      daily AS (
        SELECT
          TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
          SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
          AVG("occupancyAvg") AS "avgOccupancy",
          SUM("sampleCount") AS "sampleCount"
        FROM "HourlyStationStat"
        WHERE "bucketStart" >= ${e}::timestamp
          AND "bucketStart" < ${n}::timestamp
        GROUP BY 1
      )
      SELECT
        date_series.day AS day,
        COALESCE(daily."demandScore", 0) AS "demandScore",
        COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
        COALESCE(daily."sampleCount", 0) AS "sampleCount"
      FROM date_series
      LEFT JOIN daily ON daily.day = date_series.day
      ORDER BY date_series.day ASC;
    `}let i=Math.max(0,Math.max(1,Math.min(365,Math.floor(n)))-1);return o.Prisma.sql`
    WITH date_series AS (
      SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '1 day' * ${i})::timestamp,
        (CURRENT_DATE)::timestamp,
        '1 day'::interval
      ) AS day
    ),
    daily AS (
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
        SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
        AVG("occupancyAvg") AS "avgOccupancy",
        SUM("sampleCount") AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" >= CURRENT_DATE::timestamp - INTERVAL '1 day' * ${i}
      GROUP BY 1
    )
    SELECT
      date_series.day AS day,
      COALESCE(daily."demandScore", 0) AS "demandScore",
      COALESCE(daily."avgOccupancy", 0) AS "avgOccupancy",
      COALESCE(daily."sampleCount", 0) AS "sampleCount"
    FROM date_series
    LEFT JOIN daily ON daily.day = date_series.day
    ORDER BY date_series.day ASC;
  `}async function y(){let t=new Set,[r,i,o]=await Promise.all([n.$queryRaw`
      SELECT DISTINCT TO_CHAR("bucketStart", 'YYYY-MM') AS "monthKey"
      FROM "HourlyStationStat"
      WHERE "bucketStart" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch(e=>(a.warn(`analytics.read.monthly_keys_hourly_failed`,{error:e}),[])),n.$queryRaw`
      SELECT DISTINCT TO_CHAR("bucketDate", 'YYYY-MM') AS "monthKey"
      FROM "DailyStationStat"
      WHERE "bucketDate" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch(e=>(a.warn(`analytics.read.monthly_keys_daily_failed`,{error:e}),[])),n.$queryRaw`
      SELECT DISTINCT TO_CHAR("recordedAt", 'YYYY-MM') AS "monthKey"
      FROM "StationStatus"
      WHERE "recordedAt" IS NOT NULL
      ORDER BY "monthKey" DESC;
    `.catch(e=>(a.warn(`analytics.read.monthly_keys_status_failed`,{error:e}),[]))]);for(let n of[...r,...i,...o])e(n.monthKey)&&t.add(n.monthKey);return Array.from(t).sort((e,t)=>t.localeCompare(e))}function b(e){return typeof e==`number`?e:typeof e==`bigint`||typeof e==`string`?Number(e):e&&typeof e==`object`&&`toString`in e&&typeof e.toString==`function`?Number(e.toString()):0}async function x(e,t=20){return e===`availability`?n.$queryRaw`
      SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
      FROM "StationRanking"
      WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
      ORDER BY ("emptyHours" + "fullHours") DESC
      LIMIT ${t};
    `:n.$queryRaw`
    SELECT id, "stationId", "turnoverScore", "emptyHours", "fullHours", "totalHours", "windowStart", "windowEnd"
    FROM "StationRanking"
    WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
    ORDER BY "turnoverScore" DESC
    LIMIT ${t};
  `}async function S(e){if(e.length===0)return[];let t=[...new Set(e)];return(await n.stationPattern.findMany({where:{stationId:{in:t}},select:{stationId:!0,dayType:!0,hour:!0,occupancyAvg:!0,sampleCount:!0}})).map(e=>({stationId:e.stationId,dayType:String(e.dayType),hour:e.hour,occupancyAvg:e.occupancyAvg,sampleCount:e.sampleCount}))}async function C(){return(await n.$queryRaw`
    WITH latest AS (
      SELECT "stationId", MAX("recordedAt") AS "recordedAt"
      FROM "StationStatus"
      GROUP BY "stationId"
    )
    SELECT "Station".id, "Station".name, "Station".lat, "Station".lon, "Station".capacity,
      "StationStatus"."bikesAvailable", "StationStatus"."anchorsFree", "StationStatus"."recordedAt"
    FROM "Station"
    INNER JOIN latest ON latest."stationId" = "Station".id
    INNER JOIN "StationStatus"
      ON "StationStatus"."stationId" = latest."stationId"
      AND "StationStatus"."recordedAt" = latest."recordedAt"
    WHERE "Station"."isActive" = true
    ORDER BY "Station".name ASC;
  `).map(e=>({...e,recordedAt:e.recordedAt instanceof Date?e.recordedAt.toISOString():e.recordedAt}))}async function w(e=50){return n.$queryRaw`
    SELECT id, "stationId", "alertType", severity, "metricValue", "windowHours", "generatedAt", "isActive"
    FROM "StationAlert"
    WHERE "isActive" = true
    ORDER BY "generatedAt" DESC
    LIMIT ${e};
  `}async function T(e=30,t){let r=v(e,t);return(await n.$queryRaw(r)).map(e=>({...e,demandScore:b(e.demandScore),avgOccupancy:b(e.avgOccupancy),sampleCount:b(e.sampleCount)}))}async function E(e=12){let t=Math.max(1,Math.min(240,Math.floor(e))),r=await n.$queryRaw`
    WITH monthly AS (
      SELECT
        TO_CHAR("bucketDate", 'YYYY-MM') AS "monthKey",
        COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore",
        COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
        COUNT(DISTINCT "stationId") AS "activeStations",
        COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
      FROM "DailyStationStat"
      WHERE "bucketDate" IS NOT NULL
      GROUP BY TO_CHAR("bucketDate", 'YYYY-MM')
      ORDER BY "monthKey" DESC
      LIMIT ${t}
    )
    SELECT "monthKey", "demandScore", "avgOccupancy", "activeStations", "sampleCount"
    FROM monthly
    ORDER BY "monthKey" ASC;
  `.catch(e=>(a.warn(`analytics.read.monthly_demand_daily_failed`,{error:e}),[]));return r.length>0?r.map(e=>({...e,demandScore:b(e.demandScore),avgOccupancy:b(e.avgOccupancy),activeStations:b(e.activeStations),sampleCount:b(e.sampleCount)})):(await n.$queryRaw`
    WITH monthly AS (
      SELECT
        TO_CHAR("bucketStart", 'YYYY-MM') AS "monthKey",
        COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore",
        COALESCE(AVG("occupancyAvg"), 0) AS "avgOccupancy",
        COUNT(DISTINCT "stationId") AS "activeStations",
        COALESCE(SUM("sampleCount"), 0) AS "sampleCount"
      FROM "HourlyStationStat"
      WHERE "bucketStart" IS NOT NULL
      GROUP BY TO_CHAR("bucketStart", 'YYYY-MM')
      ORDER BY "monthKey" DESC
      LIMIT ${t}
    )
    SELECT "monthKey", "demandScore", "avgOccupancy", "activeStations", "sampleCount"
    FROM monthly
    ORDER BY "monthKey" ASC;
  `.catch(e=>(a.warn(`analytics.read.monthly_demand_hourly_failed`,{error:e}),[]))).map(e=>({...e,demandScore:b(e.demandScore),avgOccupancy:b(e.avgOccupancy),activeStations:b(e.activeStations),sampleCount:b(e.sampleCount)}))}async function D(e=14,t){let r=_(`bucketStart`,e,t);return(await n.$queryRaw`
    SELECT
      EXTRACT(HOUR FROM "bucketStart")::int AS hour,
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG("bikesAvg") AS "avgBikesAvailable",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE ${r}
    GROUP BY EXTRACT(HOUR FROM "bucketStart")::int
    ORDER BY hour ASC;
  `).map(e=>({...e,hour:b(e.hour),avgOccupancy:b(e.avgOccupancy),avgBikesAvailable:b(e.avgBikesAvailable),sampleCount:b(e.sampleCount)}))}export{S as a,D as c,E as i,h as l,y as n,x as o,T as r,C as s,w as t,s as u};