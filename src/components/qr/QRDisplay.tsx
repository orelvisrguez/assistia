'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQRRotation } from '@/hooks/useQRRotation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QRDisplayProps {
  sessionId: string;
  courseName: string;
  attendanceCount?: number;
}

export function QRDisplay({ sessionId, courseName, attendanceCount = 0 }: QRDisplayProps) {
  const { qrData, timeLeft, isLoading, error } = useQRRotation({ sessionId });

  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{courseName}</CardTitle>
          <p className="text-muted-foreground">Escanea el código para registrar tu asistencia</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={qrData}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-lg"
            >
              {isLoading ? (
                <div className="w-80 h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : (
                <QRCodeSVG 
                  value={qrData} 
                  size={320} 
                  level="H"
                  includeMargin={true}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <motion.div
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  timeLeft <= 3 ? 'bg-destructive' : 'bg-primary'
                }`}
              >
                {timeLeft}
              </motion.div>
              <span className="text-muted-foreground">segundos</span>
            </div>

            <div className="h-10 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-lg px-4 py-2">
                {attendanceCount} presentes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
