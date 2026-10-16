'use client';

import { useCallback } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { DASHBOARD_DENSITIES } from '@/lib/dashboard-search';
import { useIsHydrated, useStorageValue, writeStorageText } from '@/lib/use-storage-value';

const dashboardRouteApi = getRouteApi('/dashboard/');

export type DashboardDensity = (typeof DASHBOARD_DENSITIES)[number];

const STORAGE_KEY = 'bizidashboard-density';

function isDashboardDensity(value: string | null | undefined): value is DashboardDensity {
  return value === 'quick' || value === 'full';
}

function parseStoredDensity(raw: string | null): DashboardDensity {
  return isDashboardDensity(raw) ? raw : 'full';
}

export type UseDashboardDensityResult = {
  density: DashboardDensity;
  setDensity: (next: DashboardDensity) => void;
  mounted: boolean;
};

export function useDashboardDensity(): UseDashboardDensityResult {
  const navigate = useNavigate({ from: '/dashboard/' });
  const urlDensity = dashboardRouteApi.useSearch({ select: (search) => search.density });
  const urlValid = isDashboardDensity(urlDensity);

  const mounted = useIsHydrated();
  const storedDensity = useStorageValue(STORAGE_KEY, parseStoredDensity, 'full');

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

      writeStorageText(STORAGE_KEY, next);

      void navigate({
        replace: true,
        search: (prev) => (prev.density === next ? prev : { ...prev, density: next }),
      });
    },
    [navigate]
  );

  return { density, setDensity, mounted };
}
