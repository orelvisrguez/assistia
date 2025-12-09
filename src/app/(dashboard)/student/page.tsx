'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, BookOpen, CheckCircle2, TrendingUp,
  Award, Zap, ChevronRight, Sparkles, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankConfig = (rank: string) => {
    switch (rank) {
      case 'Oro': return { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10' };
      case 'Plata': return { gradient: 'from-slate-300 to-slate-400', bg: 'bg-slate-500/10' };
      default: return { gradient: 'from-amber-600 to-orange-600', bg: 'bg-amber-500/10' };
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const rankConfig = getRankConfig(stats.rank);

  return (
    <div className="space-y-6">
      {/* Welcome Header with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white"
      >
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium text-white/80">Bienvenido</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Mi Dashboard</h1>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-xs text-white/80">Cursos</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-xs text-white/80">Asistencia</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.streak}</p>
              <p className="text-xs text-white/80">Racha</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Session Alert */}
      {activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Link href="/student/scan">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                  <div className="relative p-3 bg-white/20 backdrop-blur-sm rounded-full">
                    <Zap className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">Clase en Curso</p>
                  <p className="text-sm text-white/80">
                    {activeSessions[0].courseCode} - {activeSessions[0].courseName}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Scan QR Button - Prominent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link href="/student/scan">
          <Button className="w-full h-16 text-lg gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-indigo-500/25">
            <div className="p-2 bg-white/20 rounded-xl">
              <QrCode className="h-6 w-6" />
            </div>
            Escanear Codigo QR
          </Button>
        </Link>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-lg">Mi Progreso</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Meta: 90% asistencia</span>
              <span className={`font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
                {stats.attendanceRate}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  stats.attendanceRate >= 90 
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                    : stats.attendanceRate >= 70 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xl font-bold">{stats.totalPresent}</span>
              </div>
              <p className="text-xs text-slate-500">Asistencias</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-orange-500 mb-1">
                <Zap className="h-5 w-5" />
                <span className="text-xl font-bold">{stats.streak}</span>
              </div>
              <p className="text-xs text-slate-500">Dias seguidos</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-3xl p-5 ${rankConfig.bg} border border-slate-100 dark:border-slate-700`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${rankConfig.gradient}`}>
            <Award className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">Tu Rango Actual</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${rankConfig.gradient} bg-clip-text text-transparent`}>
              {stats.rank}
            </p>
          </div>
          <TrendingUp className="h-6 w-6 text-slate-400" />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link href="/student/courses">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <p className="font-medium">Mis Cursos</p>
            <p className="text-xs text-slate-500">{stats.totalCourses} inscritos</p>
          </div>
        </Link>
        <Link href="/student/history">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-medium">Historial</p>
            <p className="text-xs text-slate-500">Ver asistencias</p>
          </div>
        </Link>
      </motion.div>

      {/* Achievement Banner */}
      {stats.attendanceRate >= 90 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white"
        >
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-white/10 transform skew-x-12" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">Excelente!</p>
              <p className="text-sm text-white/80">Mantienes una asistencia ejemplar</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
