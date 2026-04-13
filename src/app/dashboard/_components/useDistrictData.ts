'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchDistrictCollection, type DistrictCollection } from '@/lib/districts';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

const DISTRICT_CACHE_KEY = 'dashboard-districts-cache';

interface CachedDistricts {
  data: DistrictCollection;
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface UseDistrictDataResult {
  districts: DistrictCollection | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function getCachedDistricts(): DistrictCollection | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = sessionStorage.getItem(DISTRICT_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedDistricts = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(DISTRICT_CACHE_KEY);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedDistricts(data: DistrictCollection): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached: CachedDistricts = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(DISTRICT_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache write errors
  }
}

export function useDistrictData(options?: {
  immediate?: boolean;
  enabled?: boolean;
}): UseDistrictDataResult {
  const [districts, setDistricts] = useState<DistrictCollection | null>(() => 
    options?.immediate !== false ? getCachedDistricts() : null
  );
  const [loading, setLoading] = useState(!districts && options?.immediate !== false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isActiveRef = useRef(true);

  const loadDistricts = useCallback(async () => {
    if (options?.enabled === false) return;
    
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    isActiveRef.current = true;
    
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchDistrictCollection(controllerRef.current.signal);
      
      if (!payload || !isActiveRef.current) {
        return;
      }

      setDistricts(payload);
      setCachedDistricts(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError' || (err as Error).name === 'AbortException') {
        return;
      }

      isActiveRef.current = false;
      setError(err as Error);
      
      captureExceptionWithContext(err, {
        area: 'dashboard',
        operation: 'useDistrictData.loadDistricts',
      });
    } finally {
      if (isActiveRef.current) {
        setLoading(false);
      }
    }
  }, [options?.enabled]);

  const shouldLoadDistricts = options?.immediate !== false;

  useEffect(() => {
    if (shouldLoadDistricts) {
      loadDistricts();
    }

    return () => {
      isActiveRef.current = false;
      controllerRef.current?.abort();
    };
  }, [shouldLoadDistricts, loadDistricts]);

  const refetch = useCallback(() => {
    sessionStorage.removeItem(DISTRICT_CACHE_KEY);
    setDistricts(null);
    setLoading(true);
    loadDistricts();
  }, [loadDistricts]);

  return { districts, loading, error, refetch };
}

export function useDistrictMap(
  districts: DistrictCollection | null
): Map<string, string> | null {
  return useMemo(() => {
    if (!districts) return null;

    const map = new Map<string, string>();
    
    for (const feature of districts.features) {
      const props = feature.properties;
      if (props?.distrito) {
        const featureId = String(feature.id ?? props.distrito);
        map.set(featureId, props.distrito);
      }
    }

    return map;
  }, [districts]);
}