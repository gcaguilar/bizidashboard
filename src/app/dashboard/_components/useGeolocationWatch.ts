import { useCallback, useEffect, useState } from 'react';
import type { Coordinates } from '@/lib/geo';

export function useGeolocationWatch() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);

  const enableGeolocation = useCallback(() => {
    setIsGeolocationEnabled(true);
    setGeolocationError(null);
  }, []);

  useEffect(() => {
    if (!isGeolocationEnabled) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocationError('La geolocalización no está disponible en este navegador. Puedes mover el mapa manualmente.');
      return;
    }

    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocationError(null);
      },
      (error) => {
        setGeolocationError(error.message || 'No se pudo obtener tu ubicación. Puedes mover el mapa manualmente o revisar el permiso de ubicación del navegador.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 90_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, [isGeolocationEnabled]);

  return { userLocation, geolocationError, isGeolocationEnabled, enableGeolocation };
}
