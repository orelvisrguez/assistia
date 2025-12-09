'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface EndSessionButtonProps {
  sessionId: string;
}

export function EndSessionButton({ sessionId }: EndSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleEnd() {
    if (!confirm('¿Seguro que deseas terminar la clase?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        toast.success('Clase terminada');
        router.push('/professor');
        router.refresh();
      } else {
        toast.error('Error al terminar la clase');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="lg" 
      onClick={handleEnd}
      disabled={loading}
    >
      {loading ? 'Terminando...' : 'Terminar Clase'}
    </Button>
  );
}
