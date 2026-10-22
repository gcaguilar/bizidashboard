-- StationStatus recibe ~200k filas al dia y la retencion borra otras tantas
-- (de la mas antigua a la mas reciente). Con el 20 % por defecto, autovacuum
-- solo actuaba tras ~1,6 M de tuplas muertas (una vez por semana): los lotes
-- de borrado y MIN("recordedAt") recorrian paginas de indice llenas de
-- entradas muertas, y los index-only scans del indice cubriente perdian el
-- mapa de visibilidad. Al 2 % se limpia y analiza a diario.
ALTER TABLE "StationStatus" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02
);

-- HourlyStationStat recibe upserts cada hora y borrados de retencion diarios.
ALTER TABLE "HourlyStationStat" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.05
);
