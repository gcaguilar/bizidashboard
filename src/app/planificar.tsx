import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { StationStatusLabel } from '@/components/ui/station-status';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { getCitizenStatus } from '@/lib/map-colors';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { fetchStations } from '@/lib/fetch-stations';
import { appRoutes } from '@/lib/routes';
import { buildSeoHead } from '@/lib/seo-head';
import {
  pickPredictionHorizon,
  planTrip,
  type LatLon,
  type StationSuggestion,
  type TripPlan,
} from '@/lib/trip-planner';
import type { StationSnapshot } from '@/lib/api-types';

export const Route = createFileRoute('/planificar')({
  head: () =>
    buildSeoHead({
      title: 'Planificar trayecto en Bizi Zaragoza | Dónde coger y dejar la bici',
      description:
        'Indica origen y destino y te sugerimos la estación con bicis más cercana para recoger y la estación con huecos más cercana para devolver, con distancia a pie y estado actual.',
      path: appRoutes.planner(),
    }),
  component: PlannerPage,
});

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

type Point = LatLon & { label: string };
type PredictionMap = Record<string, StationPredictionsResponse | null>;

async function geocode(query: string): Promise<Point | null> {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'es');
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
  const first = rows[0];
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, label: first.display_name.split(',').slice(0, 2).join(',').trim() };
}

function getPosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, label: 'Tu ubicación' }),
      () => reject(new Error('denied')),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}

async function fetchPrediction(stationId: string): Promise<StationPredictionsResponse | null> {
  try {
    const res = await fetch(appRoutes.api.predictions(stationId));
    if (!res.ok) return null;
    return (await res.json()) as StationPredictionsResponse;
  } catch {
    return null;
  }
}

function formatWalk(s: StationSuggestion<StationSnapshot>): string {
  const distance = s.walkMeters >= 1000 ? `${(s.walkMeters / 1000).toFixed(1)} km` : `${Math.round(s.walkMeters / 10) * 10} m`;
  return `~${s.walkMinutes} min a pie (${distance})`;
}

function StationCard({
  title,
  kind,
  suggestion,
  arrivalMinutes,
  prediction,
}: {
  title: string;
  kind: 'pickup' | 'dropoff';
  suggestion: StationSuggestion<StationSnapshot> | null;
  arrivalMinutes: number | null;
  prediction: StationPredictionsResponse | null | undefined;
}) {
  if (!suggestion) {
    return (
      <Card variant="stat" className="p-4">
        <h2 className="text-sm font-bold text-[var(--foreground)]">{title}</h2>
        <p className="text-xs text-[var(--muted)]">
          {kind === 'pickup'
            ? 'Ahora mismo no hay ninguna estación con bicis disponibles.'
            : 'Ahora mismo no hay ninguna estación con huecos libres.'}
        </p>
      </Card>
    );
  }

  const { station } = suggestion;
  const horizon = pickPredictionHorizon(arrivalMinutes);
  const point = horizon ? prediction?.predictions.find((p) => p.horizonMinutes === horizon) : null;
  const predicted = kind === 'pickup' ? point?.predictedBikesAvailable : point?.predictedAnchorsFree;

  return (
    <Card variant="stat" className="gap-2 p-4">
      <h2 className="text-sm font-bold text-[var(--foreground)]">{title}</h2>
      <TrackedLink
        href={appRoutes.stationDetail(station.id)}
        ctaEvent={{ source: 'planner', ctaId: 'planner_station', destination: 'station_detail', sourceRole: 'utility', destinationRole: 'detail', transitionKind: 'within_public' }}
        className="text-base font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
      >
        {station.name}
      </TrackedLink>
      <p className="text-sm text-[var(--foreground)]">{formatWalk(suggestion)}</p>
      <StationStatusLabel status={getCitizenStatus(station)} />
      <p className="text-xs text-[var(--muted)]">
        Ahora: {station.bikesAvailable} bicis y {station.anchorsFree} huecos libres.
      </p>
      {horizon && typeof predicted === 'number' ? (
        <p className="text-xs text-[var(--muted)]">
          Estimación para dentro de ~{horizon} min (hora de llegada aproximada):{' '}
          {kind === 'pickup' ? `unas ${predicted} bicis` : `unos ${predicted} huecos libres`}. Es una estimación
          basada en el histórico, no una garantía.
        </p>
      ) : null}
    </Card>
  );
}

function PlannerPage() {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    origin: Point;
    destination: Point;
    stations: StationSnapshot[];
    plan: TripPlan<StationSnapshot>;
    predictions: PredictionMap;
  } | null>(null);

  const breadcrumbs = createRootBreadcrumbs({ label: 'Planificar trayecto', href: appRoutes.planner() });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    if ((!useLocation && originText.trim().length < 3) || destinationText.trim().length < 3) {
      setError('Escribe un origen y un destino (o usa tu ubicación como origen).');
      return;
    }
    setBusy(true);
    try {
      const [origin, destination] = await Promise.all([
        useLocation ? getPosition() : geocode(originText.trim()),
        geocode(destinationText.trim()),
      ]);
      if (!origin || !destination) {
        setError(`No hemos encontrado ${!origin ? 'el origen' : 'el destino'}. Prueba con una calle y número o un lugar conocido.`);
        return;
      }
      const stations = await fetchStations();
      const plan = planTrip(stations, origin, destination);

      const predictions: PredictionMap = {};
      const wantPickup = plan.pickup && pickPredictionHorizon(plan.pickupArrivalMinutes);
      const wantDropoff = plan.dropoff && pickPredictionHorizon(plan.dropoffArrivalMinutes);
      await Promise.all([
        wantPickup && plan.pickup
          ? fetchPrediction(plan.pickup.station.id).then((p) => void (predictions[plan.pickup!.station.id] = p))
          : null,
        wantDropoff && plan.dropoff
          ? fetchPrediction(plan.dropoff.station.id).then((p) => void (predictions[plan.dropoff!.station.id] = p))
          : null,
      ]);

      setResult({ origin, destination, stations, plan, predictions });
    } catch (err) {
      const reason = err instanceof Error ? err.message : '';
      setError(
        reason === 'denied'
          ? 'No hemos podido acceder a tu ubicación. Escribe el origen a mano.'
          : reason === 'unsupported'
            ? 'Tu navegador no permite geolocalización. Escribe el origen a mano.'
            : 'No hemos podido completar la búsqueda. Inténtalo de nuevo en unos segundos.',
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40';

  return (
    <PageShell className="gap-6 py-8 md:py-12">
      <PublicPageViewTracker pageType="utility" template="planner" pageSlug="planificar" />
      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Planificar trayecto</h1>
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          Dinos de dónde sales y a dónde vas: te sugerimos dónde coger una bici y dónde dejarla, según la
          disponibilidad actual.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="planner-origin" className="text-xs font-bold text-[var(--muted)]">Origen</label>
          <input
            id="planner-origin"
            className={inputClass}
            value={useLocation ? 'Tu ubicación' : originText}
            disabled={useLocation}
            onChange={(e) => setOriginText(e.target.value)}
            placeholder="Calle, número o lugar"
            autoComplete="off"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input type="checkbox" checked={useLocation} onChange={(e) => setUseLocation(e.target.checked)} />
            Usar mi ubicación como origen
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="planner-destination" className="text-xs font-bold text-[var(--muted)]">Destino</label>
          <input
            id="planner-destination"
            className={inputClass}
            value={destinationText}
            onChange={(e) => setDestinationText(e.target.value)}
            placeholder="Calle, número o lugar"
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={busy} className="ui-primary-button w-full sm:w-auto">
          {busy ? 'Buscando…' : 'Sugerir estaciones'}
        </button>
        {error ? (
          <p role="alert" className="text-xs text-[var(--destructive,#b91c1c)]">{error}</p>
        ) : null}
      </form>

      {result ? (
        <section aria-live="polite" className="flex flex-col gap-4">
          <p className="text-sm text-[var(--foreground)]">
            De <strong>{result.origin.label}</strong> a <strong>{result.destination.label}</strong>
            {result.plan.rideMinutes !== null ? `: unos ${result.plan.rideMinutes} min en bici entre estaciones.` : '.'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <StationCard
              title="Dónde coger la bici"
              kind="pickup"
              suggestion={result.plan.pickup}
              arrivalMinutes={result.plan.pickupArrivalMinutes}
              prediction={result.plan.pickup ? result.predictions[result.plan.pickup.station.id] : null}
            />
            <StationCard
              title="Dónde dejarla"
              kind="dropoff"
              suggestion={result.plan.dropoff}
              arrivalMinutes={result.plan.dropoffArrivalMinutes}
              prediction={result.plan.dropoff ? result.predictions[result.plan.dropoff.station.id] : null}
            />
          </div>
          {result.plan.alternativePickups.length + result.plan.alternativeDropoffs.length > 0 ? (
            <div className="grid gap-4 text-xs text-[var(--muted)] md:grid-cols-2">
              <AlternativeList title="Otras para coger" items={result.plan.alternativePickups} />
              <AlternativeList title="Otras para dejar" items={result.plan.alternativeDropoffs} />
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        Los tiempos son estimaciones: se calculan sobre la distancia en línea recta con un margen por las calles
        (a pie ~4,8 km/h, en bici ~14 km/h) y no tienen en cuenta semáforos ni el trazado real. La disponibilidad
        puede cambiar mientras llegas; la estimación futura usa el histórico de la estación y no es una garantía.
        La búsqueda de direcciones usa OpenStreetMap (Nominatim).
      </p>
    </PageShell>
  );
}

function AlternativeList({ title, items }: { title: string; items: StationSuggestion<StationSnapshot>[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-bold text-[var(--foreground)]">{title}</h3>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.station.id}>
            {item.station.name} · {formatWalk(item)} · {item.station.bikesAvailable} bicis, {item.station.anchorsFree} huecos
          </li>
        ))}
      </ul>
    </div>
  );
}
