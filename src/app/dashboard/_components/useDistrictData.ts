'use client';

import { useMemo } from 'react';
import { type DistrictCollection } from '@/lib/districts';

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
