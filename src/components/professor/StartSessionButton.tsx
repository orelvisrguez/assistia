'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';

interface StartSessionButtonProps {
  courseId: string;
  courseName: string;
}

export function StartSessionButton({ courseId, courseName }: StartSessionButtonProps) {
  const router = useRouter();
  const { getLocation } = useGeolocation();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);

    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const loc = await getLocation();
      latitude = loc.latitude;
      longitude = loc.longitude;
    } catch {
      // Location not available, continue without it
    }

    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, latitude, longitude }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Clase iniciada: ${courseName}`);
        router.push(`/professor/session/${data.session.id}`);
      } else {
        toast.error('Error al iniciar la clase');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleStart} 
      disabled={loading}
      className="w-full gap-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Iniciando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Iniciar Clase
        </>
      )}
    </Button>
  );
}
