'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Camera, CheckCircle2, XCircle, MapPin, 
  Loader2, RefreshCw, Zap, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Html5Qrcode } from 'html5-qrcode';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface ScanResult {
  success: boolean;
  message: string;
  courseName?: string;
  timestamp?: string;
}

export default function StudentScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Get location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setLocationError('No se pudo obtener la ubicación');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setStatus('scanning');
    setCameraError(null);
    setResult(null);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
      setStatus('idle');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {}
    }
  };

  const handleScan = async (qrData: string) => {
    setStatus('processing');
    await stopScanner();

    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData,
          location
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: 'Asistencia registrada exitosamente',
          courseName: data.courseName,
          timestamp: new Date().toLocaleTimeString('es-ES')
        });
        setStatus('success');
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al registrar asistencia'
        });
        setStatus('error');
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexión. Intenta nuevamente.'
      });
      setStatus('error');
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Escanear Código QR
        </h1>
        <p className="text-muted-foreground mt-2">
          Apunta la cámara al código QR del profesor
        </p>
      </div>

      {/* Location Status */}
      <div className="flex justify-center">
        <Badge 
          variant={location ? 'default' : 'secondary'}
          className={`gap-2 ${location ? 'bg-green-500' : ''}`}
        >
          <MapPin className="h-3 w-3" />
          {location ? 'Ubicación detectada' : locationError || 'Obteniendo ubicación...'}
        </Badge>
      </div>

      {/* Scanner Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6 py-8"
              >
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl opacity-20 animate-pulse" />
                  <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Listo para escanear</h3>
                  <p className="text-muted-foreground">
                    Presiona el botón para activar la cámara
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={startScanner}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Camera className="h-5 w-5" />
                  Activar Cámara
                </Button>
                {cameraError && (
                  <p className="text-red-500 text-sm">{cameraError}</p>
                )}
              </motion.div>
            )}

            {status === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-black">
                  <div id="qr-reader" className="w-full h-full" />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-white/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando código QR...
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { stopScanner(); setStatus('idle'); }}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 space-y-4"
              >
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  <Shield className="absolute inset-0 m-auto h-10 w-10 text-indigo-500" />
                </div>
                <p className="text-lg font-medium">Verificando código...</p>
                <p className="text-muted-foreground text-sm">Validando token y ubicación</p>
              </motion.div>
            )}

            {status === 'success' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="relative mx-auto w-24 h-24"
                >
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">Asistencia Registrada</h3>
                  {result.courseName && (
                    <p className="text-lg text-muted-foreground mt-2">{result.courseName}</p>
                  )}
                  {result.timestamp && (
                    <Badge variant="outline" className="mt-3">
                      <Zap className="h-3 w-3 mr-1" />
                      {result.timestamp}
                    </Badge>
                  )}
                </div>
                <Button onClick={resetScanner} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Escanear Otro
                </Button>
              </motion.div>
            )}

            {status === 'error' && result && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center"
                >
                  <XCircle className="h-12 w-12 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-red-600">Error</h3>
                  <p className="text-muted-foreground mt-2">{result.message}</p>
                </div>
                <Button onClick={resetScanner} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Intentar de Nuevo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consejos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Asegúrate de estar en el aula cuando escanees el código
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              El código QR cambia cada 10 segundos por seguridad
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Mantén el dispositivo estable mientras escaneas
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
