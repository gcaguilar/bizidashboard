import type { StationSnapshot } from '@/lib/api';

type StationPickerProps = {
  stations: StationSnapshot[];
  selectedStationId: string;
  onChange: (stationId: string) => void;
};

export function StationPicker({
  stations,
  selectedStationId,
  onChange,
}: StationPickerProps) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Estacion seleccionada
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Cambia de estacion para actualizar los paneles.
        </p>
      </div>
      <select
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)]"
        value={selectedStationId}
        onChange={(event) => onChange(event.target.value)}
      >
        {stations.length === 0 ? (
          <option value="">Sin estaciones</option>
        ) : (
          stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))
        )}
      </select>
      <p className="text-xs text-[var(--muted)]">
        Total estaciones: {stations.length}
      </p>
    </section>
  );
}
