'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (data: string) => Promise<{ success: boolean; message: string }>;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  }, []);

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    try {
      scannerRef.current = new Html5Qrcode('qr-reader');
      setScanning(true);
      setStatus('scanning');
      setMessage('');

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          setStatus('idle');
          
          try {
            const result = await onScan(decodedText);
            setStatus(result.success ? 'success' : 'error');
            setMessage(result.message);
          } catch (error) {
            setStatus('error');
            setMessage('Error al procesar el código');
          }
        },
        () => {}
      );
    } catch (error) {
      setStatus('error');
      setMessage('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Escanear Asistencia</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div
          ref={containerRef}
          id="qr-reader"
          className="w-full aspect-square max-w-xs rounded-xl overflow-hidden bg-muted"
        />

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-2 text-green-600"
          >
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium">{message}</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-2 text-destructive"
          >
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="font-medium">{message}</p>
          </motion.div>
        )}

        {!scanning && status !== 'success' && (
          <Button onClick={startScanner} size="lg" className="w-full">
            {status === 'error' ? 'Intentar de nuevo' : 'Iniciar Escáner'}
          </Button>
        )}

        {scanning && (
          <Button onClick={stopScanner} variant="outline" size="lg" className="w-full">
            Cancelar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
