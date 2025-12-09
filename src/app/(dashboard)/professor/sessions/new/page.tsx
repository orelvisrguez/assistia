'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Users, Clock, StopCircle, MapPin, RefreshCw, 
  CheckCircle2, Maximize2, Minimize2, Sparkles, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import QRCode from 'react-qr-code';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  timestamp: string;
  status: 'present' | 'late';
}

interface SessionData {
  id: string;
  qrData: string;
  timeLeft: number;
  attendanceCount: number;
  totalStudents: number;
}

export default function NewSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourse = searchParams.get('course');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(preselectedCourse || '');
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      refreshQR();
      fetchAttendance();
    }, 10000);

    const countdown = setInterval(() => {
      setSession(prev => prev ? { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) } : null);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [session?.id]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/professor/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    });
  };

  const startSession = async () => {
    if (!selectedCourse) return;
    setIsStarting(true);

    try {
      let locationData = null;
      if (useGeolocation) {
        const pos = await getCurrentLocation();
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(locationData);
      }

      const res = await fetch('/api/professor/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId: selectedCourse,
          location: locationData,
          useGeolocation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSession({
          id: data.sessionId,
          qrData: data.qrData,
          timeLeft: 10,
          attendanceCount: 0,
          totalStudents: data.totalStudents
        });
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const refreshQR = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/professor/sessions/${session.id}/qr`);
      if (res.ok) {
        const data = await res.json();
        setSession(prev => prev ? { ...prev, qrData: data.qrData, timeLeft: 10 } : null);
      }
    } catch (error) {
      console.error('Error refreshing QR:', error);
    }
  };

  const fetchAttendance = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/professor/sessions/${session.id}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.records);
        setSession(prev => prev ? { ...prev, attendanceCount: data.count } : null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await fetch(`/api/professor/sessions/${session.id}/end`, { method: 'POST' });
      router.push('/professor/sessions');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Pre-session setup screen
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-xl shadow-indigo-500/30">
            <QrCode className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Iniciar Nueva Sesion
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Configura y comienza una clase con codigo QR
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-900 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Seleccionar Curso</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Elige un curso para iniciar" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="py-3">
                        <span className="font-medium">{course.code}</span> - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500 text-white">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Validacion por ubicacion</p>
                    <p className="text-sm text-muted-foreground">
                      Los estudiantes deben estar fisicamente cerca
                    </p>
                  </div>
                </div>
                <Switch checked={useGeolocation} onCheckedChange={setUseGeolocation} className="scale-125" />
              </div>

              <Button 
                className="w-full h-16 text-xl gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/25" 
                size="lg"
                onClick={startSession}
                disabled={!selectedCourse || isStarting}
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6" />
                    Iniciar Sesion
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Active session with QR display
  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-background min-h-screen' : ''}`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
              Sesion Activa
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">
            {courses.find(c => c.id === selectedCourse)?.name}
          </h1>
          <p className="text-muted-foreground">
            {courses.find(c => c.id === selectedCourse)?.code}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={toggleFullscreen} className="gap-2">
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            {isFullscreen ? 'Salir' : 'Pantalla Completa'}
          </Button>
          <Button variant="destructive" onClick={endSession} className="gap-2 shadow-lg">
            <StopCircle className="h-5 w-5" />
            Finalizar
          </Button>
        </div>
      </motion.div>

      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* QR Code Display - Main Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={isFullscreen ? 'lg:col-span-2' : ''}
        >
          <Card className="overflow-hidden border-2 shadow-2xl">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardContent className={`flex flex-col items-center gap-8 ${isFullscreen ? 'py-12' : 'py-8'}`}>
              {/* QR Code with animation */}
              <motion.div
                key={session.qrData}
                initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <div className={`relative p-8 bg-white rounded-3xl shadow-2xl ${isFullscreen ? 'p-12' : ''}`}>
                  <QRCode 
                    value={session.qrData} 
                    size={isFullscreen ? 400 : 300} 
                    level="H"
                    style={{ display: 'block' }}
                  />
                </div>
                
                {/* Corner decorations */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              </motion.div>

              {/* Timer */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className={`h-8 w-8 ${session.timeLeft <= 3 ? 'text-red-500' : 'text-indigo-500'}`} />
                  </motion.div>
                  <span className={`text-7xl font-bold font-mono tabular-nums ${session.timeLeft <= 3 ? 'text-red-500' : ''}`}>
                    {session.timeLeft}
                  </span>
                  <span className="text-3xl text-muted-foreground">s</span>
                </div>
                <p className="text-muted-foreground">El codigo se actualiza automaticamente</p>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2 text-base gap-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                  Conexion activa
                </Badge>
                {location && (
                  <Badge variant="outline" className="px-4 py-2 text-base gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Geolocalizacion activa
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Attendance Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Asistencia en Vivo
                </span>
                <div className="flex items-center gap-2">
                  <motion.div
                    key={session.attendanceCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-emerald-600"
                  >
                    {session.attendanceCount}
                  </motion.div>
                  <span className="text-muted-foreground">/ {session.totalStudents}</span>
                </div>
              </CardTitle>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(session.attendanceCount / session.totalStudents) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round((session.attendanceCount / session.totalStudents) * 100)}% de asistencia
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`space-y-2 overflow-y-auto ${isFullscreen ? 'max-h-[500px]' : 'max-h-[400px]'}`}>
                <AnimatePresence mode="popLayout">
                  {attendance.length === 0 ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 mb-4"
                      >
                        <Users className="h-8 w-8 text-indigo-500" />
                      </motion.div>
                      <p className="text-muted-foreground">Esperando estudiantes...</p>
                    </div>
                  ) : (
                    attendance.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-900"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-2 rounded-full bg-emerald-500 text-white"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </motion.div>
                          <div>
                            <p className="font-semibold">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">{record.timestamp}</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          Presente
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
