import { useCallback, useEffect, useState } from 'react';
import type { Coordinates } from '@/lib/geo';

function describeGeolocationError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Permiso de ubicación denegado. Actívalo en el navegador para centrar el mapa en tu posición.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'No se pudo determinar tu ubicación ahora mismo. Puedes mover el mapa manualmente.';
  }

  if (error.code === error.TIMEOUT) {
    return 'La ubicación está tardando demasiado. Inténtalo de nuevo o mueve el mapa manualmente.';
  }

  return 'No se pudo obtener tu ubicación. Puedes mover el mapa manualmente o revisar el permiso de ubicación del navegador.';
}

export function useGeolocationWatch() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);

  const enableGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocationError(
        'La geolocalización no está disponible en este navegador. Puedes mover el mapa manualmente.'
      );
      return;
    }

    setGeolocationError(null);
    setIsGeolocationEnabled(true);
  }, []);

  useEffect(() => {
    if (!isGeolocationEnabled) {
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
        setGeolocationError(describeGeolocationError(error));
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
