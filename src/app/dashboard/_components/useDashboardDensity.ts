'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { DASHBOARD_DENSITIES } from '@/lib/dashboard-search';
import { getLocationSearchParams } from '@/lib/router-search';

export type DashboardDensity = (typeof DASHBOARD_DENSITIES)[number];

const STORAGE_KEY = 'bizidashboard-density';

function isDashboardDensity(value: string | null | undefined): value is DashboardDensity {
  return value === 'quick' || value === 'full';
}

function readStoredDensity(): DashboardDensity {
  if (typeof window === 'undefined') {
    return 'full';
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isDashboardDensity(raw) ? raw : 'full';
  } catch {
    return 'full';
  }
}

function persistDensity(value: DashboardDensity): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore quota exceeded and private browsing failures.
  }
}

export type UseDashboardDensityResult = {
  density: DashboardDensity;
  setDensity: (next: DashboardDensity) => void;
  mounted: boolean;
};

export function useDashboardDensity(): UseDashboardDensityResult {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = getLocationSearchParams(location);
  const urlDensity = searchParams.get('density');
  const urlValid = isDashboardDensity(urlDensity);

  const [storedDensity, setStoredDensity] = useState<DashboardDensity>('full');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStoredDensity(readStoredDensity());
    setMounted(true);
  }, []);

  const density: DashboardDensity = mounted
    ? urlValid
      ? urlDensity
      : storedDensity
    : 'full';

  const setDensity = useCallback(
    (next: DashboardDensity) => {
      if (next !== 'quick' && next !== 'full') {
        return;
      }

      persistDensity(next);
      setStoredDensity(next);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('density', next);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void navigate({ search: Object.fromEntries(nextParams) as any, replace: true });
    },
    [navigate, searchParams]
  );

  return { density, setDensity, mounted };
}
