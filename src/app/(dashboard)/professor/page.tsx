'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Users, Calendar, Clock, TrendingUp, 
  Play, QrCode, BarChart3, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  activeSessions: number;
  todayAttendance: number;
  weeklyRate: number;
}

interface RecentSession {
  id: string;
  courseName: string;
  date: string;
  attendanceCount: number;
  totalStudents: number;
}

export default function ProfessorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    activeSessions: 0,
    todayAttendance: 0,
    weeklyRate: 0
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/professor/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentSessions(data.recentSessions || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Mis Cursos', value: stats.totalCourses, icon: BookOpen, color: 'from-blue-500 to-blue-600', href: '/professor/courses' },
    { title: 'Total Estudiantes', value: stats.totalStudents, icon: Users, color: 'from-emerald-500 to-emerald-600', href: '/professor/courses' },
    { title: 'Sesiones Activas', value: stats.activeSessions, icon: Play, color: 'from-orange-500 to-orange-600', href: '/professor/sessions' },
    { title: 'Asistencia Hoy', value: stats.todayAttendance, icon: CheckCircle2, color: 'from-purple-500 to-purple-600', href: '/professor/attendance' },
  ];

  const quickActions = [
    { title: 'Iniciar Sesión', description: 'Comenzar clase con QR', icon: QrCode, href: '/professor/sessions/new', color: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
    { title: 'Ver Asistencia', description: 'Historial completo', icon: BarChart3, href: '/professor/attendance', color: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { title: 'Mis Cursos', description: 'Gestionar cursos', icon: BookOpen, href: '/professor/courses', color: 'bg-gradient-to-br from-orange-500 to-red-500' },
    { title: 'Calendario', description: 'Próximas clases', icon: Calendar, href: '/professor/calendar', color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Panel del Profesor
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus clases y controla la asistencia en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className={`${action.color} text-white hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer h-full`}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <action.icon className="h-10 w-10" />
                    <div>
                      <p className="font-semibold text-lg">{action.title}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Sesiones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay sesiones recientes</p>
              ) : (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium">{session.courseName}</p>
                      <p className="text-sm text-muted-foreground">{session.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{session.attendanceCount}/{session.totalStudents}</p>
                      <p className="text-xs text-muted-foreground">asistentes</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Rendimiento Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-emerald-600">{stats.weeklyRate}%</div>
                <p className="text-muted-foreground mt-2">Tasa de asistencia promedio</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progreso semanal</span>
                  <span className="font-medium">{stats.weeklyRate}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.weeklyRate}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
