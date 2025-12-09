'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Users, Clock, StopCircle, MapPin, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
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

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Iniciar Nueva Sesión</h1>
          <p className="text-muted-foreground">Configura y comienza una clase con código QR</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Seleccionar Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Validación por ubicación</p>
                  <p className="text-sm text-muted-foreground">
                    Requiere que los estudiantes estén cerca físicamente
                  </p>
                </div>
              </div>
              <Switch checked={useGeolocation} onCheckedChange={setUseGeolocation} />
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={startSession}
              disabled={!selectedCourse || isStarting}
            >
              <QrCode className="h-5 w-5" />
              {isStarting ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sesión en Curso</h1>
          <p className="text-muted-foreground">
            {courses.find(c => c.id === selectedCourse)?.name}
          </p>
        </div>
        <Button variant="destructive" onClick={endSession} className="gap-2">
          <StopCircle className="h-5 w-5" />
          Finalizar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR
              </span>
              <Badge variant="outline" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-refresh
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-8">
            <motion.div
              key={session.qrData}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-white rounded-2xl shadow-lg"
            >
              <QRCode value={session.qrData} size={280} level="H" />
            </motion.div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-6xl font-bold font-mono">
                <Clock className="h-10 w-10 text-muted-foreground" />
                <span className={session.timeLeft <= 3 ? 'text-red-500' : ''}>{session.timeLeft}s</span>
              </div>
              <p className="text-muted-foreground mt-2">hasta la siguiente actualización</p>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-green-500" />
                Validación de ubicación activa
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asistencia en Tiempo Real
              </span>
              <Badge className="bg-emerald-500">
                {session.attendanceCount}/{session.totalStudents}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    Esperando registros de asistencia...
                  </p>
                ) : (
                  attendance.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {record.status === 'present' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{record.studentName}</p>
                          <p className="text-sm text-muted-foreground">{record.studentEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                          {record.status === 'present' ? 'Presente' : 'Tardanza'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{record.timestamp}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
