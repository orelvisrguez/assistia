'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseQRRotationOptions {
  sessionId: string;
  interval?: number;
}

export function useQRRotation({ sessionId, interval = 10000 }: UseQRRotationOptions) {
  const [qrData, setQrData] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(interval / 1000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr/generate?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Error al generar QR');
      const { payload } = await res.json();
      setQrData(payload);
      setTimeLeft(interval / 1000);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, interval]);

  useEffect(() => {
    fetchQR();
    const qrInterval = setInterval(fetchQR, interval);
    const countdownInterval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : interval / 1000));
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchQR, interval]);

  return { qrData, timeLeft, isLoading, error, refresh: fetchQR };
}
