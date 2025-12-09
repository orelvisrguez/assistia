'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, BookOpen, CheckCircle2, Clock, TrendingUp,
  Calendar, Award, Target, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DashboardStats {
  totalCourses: number;
  attendanceRate: number;
  totalPresent: number;
  totalSessions: number;
  streak: number;
  rank: string;
}

interface ActiveSession {
  id: string;
  courseName: string;
  courseCode: string;
  professorName: string;
  startTime: string;
}

interface UpcomingClass {
  id: string;
  courseName: string;
  courseCode: string;
  schedule: string;
  nextClass: string;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    attendanceRate: 0,
    totalPresent: 0,
    totalSessions: 0,
    streak: 0,
    rank: 'Bronce'
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/student/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActiveSessions(data.activeSessions || []);
        setUpcomingClasses(data.upcomingClasses || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Oro': return 'from-yellow-400 to-yellow-600';
      case 'Plata': return 'from-gray-300 to-gray-500';
      default: return 'from-amber-600 to-amber-800';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Mi Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, gestiona tu asistencia y revisa tu progreso
        </p>
      </div>

      {/* Active Sessions Alert */}
      {activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden"
        >
          <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
                    <div className="relative p-3 bg-green-500 rounded-full">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-700 dark:text-green-300">
                      Clase en Curso
                    </h3>
                    <p className="text-green-600 dark:text-green-400">
                      {activeSessions[0].courseCode} - {activeSessions[0].courseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prof. {activeSessions[0].professorName}
                    </p>
                  </div>
                </div>
                <Link href="/student/scan">
                  <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 animate-pulse">
                    <QrCode className="h-5 w-5" />
                    Escanear QR Ahora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mis Cursos</p>
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asistencia</p>
                  <p className={`text-3xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
                    {stats.attendanceRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asistencias</p>
                  <p className="text-3xl font-bold">{stats.totalPresent}/{stats.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${getRankColor(stats.rank)}/20 to-transparent rounded-bl-full`} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getRankColor(stats.rank)}`}>
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rango</p>
                  <p className="text-3xl font-bold">{stats.rank}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/scan" className="block">
              <Button className="w-full gap-2 h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <QrCode className="h-6 w-6" />
                Escanear QR
              </Button>
            </Link>
            <Link href="/student/courses" className="block">
              <Button variant="outline" className="w-full gap-2 h-12">
                <BookOpen className="h-5 w-5" />
                Ver Mis Cursos
              </Button>
            </Link>
            <Link href="/student/history" className="block">
              <Button variant="outline" className="w-full gap-2 h-12">
                <Calendar className="h-5 w-5" />
                Historial de Asistencia
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Mi Progreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meta de asistencia (90%)</span>
                <span className={getAttendanceColor(stats.attendanceRate)}>{stats.attendanceRate}%</span>
              </div>
              <Progress value={stats.attendanceRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.streak}</span>
                </div>
                <p className="text-sm text-muted-foreground">Racha de días</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.totalPresent}</span>
                </div>
                <p className="text-sm text-muted-foreground">Clases asistidas</p>
              </div>
            </div>

            {stats.attendanceRate >= 90 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
                <p className="text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Excelente! Mantienes una asistencia ejemplar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Clases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <Badge variant="outline" className="mb-2">{cls.courseCode}</Badge>
                  <h4 className="font-medium">{cls.courseName}</h4>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{cls.schedule}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
