'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, User, Clock, Calendar,
  CheckCircle2, XCircle, AlertCircle, TrendingUp,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CourseDetail {
  course: {
    id: string;
    name: string;
    code: string;
    schedule: string;
    professorName: string;
  };
  stats: {
    totalSessions: number;
    completedSessions: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  sessions: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionStatus: string;
    attendanceStatus: string;
    timestamp: string | null;
  }>;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseDetail();
  }, [params.id]);

  const fetchCourseDetail = async () => {
    try {
      const res = await fetch(`/api/student/courses/${params.id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cargar');
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'late':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'late': return 'Tarde';
      case 'absent': return 'Ausente';
      default: return 'Pendiente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'late': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'absent': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-lg font-medium">{error || 'Curso no encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { course, stats, sessions } = data;
  const rateColor = stats.attendanceRate >= 80 ? 'text-green-600' : 
                    stats.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Badge variant="outline" className="mb-1">{course.code}</Badge>
          <h1 className="text-2xl font-bold">{course.name}</h1>
        </div>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Prof. {course.professorName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{course.schedule}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-xs opacity-80">Asistencia</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.presentCount}</p>
              <p className="text-xs opacity-80">Presentes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.lateCount}</p>
              <p className="text-xs opacity-80">Tardanzas</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats.absentCount}</p>
              <p className="text-xs opacity-80">Ausencias</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Clases
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay clases registradas</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.attendanceStatus)}
                    <div>
                      <p className="font-medium">{formatDate(session.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(session.attendanceStatus)}>
                    {getStatusLabel(session.attendanceStatus)}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
