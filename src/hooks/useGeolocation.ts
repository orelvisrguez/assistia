'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalización no soportada' }));
      return Promise.reject('Geolocalización no soportada');
    }

    setState((s) => ({ ...s, loading: true }));

    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({ latitude, longitude, error: null, loading: false });
          resolve({ latitude, longitude });
        },
        (error) => {
          const errorMsg = error.message || 'Error de geolocalización';
          setState((s) => ({ ...s, error: errorMsg, loading: false }));
          reject(errorMsg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  return { ...state, getLocation };
}
