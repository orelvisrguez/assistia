'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Camera, CheckCircle2, XCircle, MapPin, 
  Loader2, RefreshCw, Shield, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocationError('No se pudo obtener la ubicacion'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    setStatus('scanning');
    setCameraError(null);
    setResult(null);

    // Esperar a que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Intentar primero con cámara trasera
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => { await handleScan(decodedText); },
          () => {}
        );
      } catch {
        // Fallback: intentar con cualquier cámara disponible
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scanner.start(
            devices[0].id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => { await handleScan(decodedText); },
            () => {}
          );
        } else {
          throw new Error('No se encontraron cámaras');
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setCameraError(`No se pudo acceder a la cámara: ${errorMsg}`);
      setStatus('idle');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleScan = async (qrData: string) => {
    setStatus('processing');
    await stopScanner();

    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, location })
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: 'Asistencia registrada',
          courseName: data.courseName,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        });
        setStatus('success');
      } else {
        setResult({ success: false, message: data.error || 'Error al registrar' });
        setStatus('error');
      }
    } catch (error) {
      setResult({ success: false, message: 'Error de conexion' });
      setStatus('error');
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Escanear QR
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Apunta la camara al codigo del profesor
        </p>
      </motion.div>

      {/* Location Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-6"
      >
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          location 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
        }`}>
          <MapPin className="h-4 w-4" />
          {location ? 'Ubicacion detectada' : locationError || 'Obteniendo ubicacion...'}
        </div>
      </motion.div>

      {/* Scanner Container */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              {/* Animated QR Icon */}
              <div className="relative mx-auto w-40 h-40">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl opacity-20"
                />
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30"
                >
                  <QrCode className="h-20 w-20 text-white" />
                </motion.div>
                
                {/* Corner decorations */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Listo para escanear</h3>
                <p className="text-slate-500 text-sm">
                  El codigo QR cambia cada 10 segundos
                </p>
              </div>

              <Button 
                size="lg"
                onClick={startScanner}
                className="w-full max-w-xs h-14 text-lg gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-indigo-500/25"
              >
                <Camera className="h-6 w-6" />
                Activar Camara
              </Button>

              {cameraError && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {cameraError}
                </div>
              )}
            </motion.div>
          )}

          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm space-y-4"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl">
                <div id="qr-reader" className="w-full h-full" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner frame */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-indigo-400 rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-indigo-400 rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-indigo-400 rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-indigo-400 rounded-br-2xl" />
                    
                    {/* Scanning line */}
                    <motion.div
                      className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full shadow-lg shadow-indigo-500/50"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando codigo QR...
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => { stopScanner(); setStatus('idle'); }}
                className="w-full h-12 rounded-xl"
              >
                Cancelar
              </Button>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="relative mx-auto w-28 h-28">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"
                  style={{ borderTopColor: 'rgb(99 102 241)' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="h-12 w-12 text-indigo-500" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold">Verificando...</p>
                <p className="text-sm text-slate-500">Validando token y ubicacion</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="relative mx-auto w-32 h-32"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="absolute inset-0 bg-emerald-500/20 rounded-full"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
                
                {/* Sparkles */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-6 w-6 text-amber-400" />
                </motion.div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-emerald-600">Asistencia Registrada</h3>
                {result.courseName && (
                  <p className="text-lg text-slate-600 mt-2">{result.courseName}</p>
                )}
                {result.timestamp && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    {result.timestamp}
                  </div>
                )}
              </div>

              <Button 
                onClick={resetScanner}
                className="gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <RefreshCw className="h-5 w-5" />
                Escanear Otro
              </Button>
            </motion.div>
          )}

          {status === 'error' && result && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto w-28 h-28 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30"
              >
                <XCircle className="h-14 w-14 text-white" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-red-600">Error</h3>
                <p className="text-slate-600 mt-2">{result.message}</p>
              </div>

              <Button 
                onClick={resetScanner}
                variant="outline"
                className="gap-2 h-12 px-6 rounded-xl"
              >
                <RefreshCw className="h-5 w-5" />
                Intentar de Nuevo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tips - Only show in idle */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4"
        >
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Consejos</p>
          <div className="space-y-2">
            {[
              'Asegurate de estar en el aula',
              'El codigo cambia cada 10 segundos',
              'Manten el dispositivo estable'
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
