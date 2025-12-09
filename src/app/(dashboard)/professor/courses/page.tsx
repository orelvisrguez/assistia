'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Calendar, Play, Eye, BarChart2, Sparkles, TrendingUp, StopCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  schedule: string;
  studentCount: number;
  totalSessions: number;
  avgAttendance: number;
  hasActiveSession: boolean;
  activeSessionId?: string;
}

const gradients = [
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-orange-500 via-red-500 to-pink-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-green-500 via-emerald-500 to-teal-500',
];

export default function ProfessorCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/professor/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'from-emerald-500 to-green-500';
    if (rate >= 60) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  const endSession = async (sessionId: string, courseName: string) => {
    if (!confirm(`¿Terminar la clase de ${courseName}?`)) return;
    try {
      const res = await fetch(`/api/professor/sessions/${sessionId}/end`, { method: 'POST' });
      if (res.ok) {
        alert('Clase terminada exitosamente');
        fetchCourses();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo terminar la clase'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al terminar la clase');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Mis Cursos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus cursos y sesiones de clase
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <BookOpen className="h-4 w-4" />
          <span>{courses.length} cursos activos</span>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-muted to-muted/50" />
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tienes cursos asignados</h3>
              <p className="text-muted-foreground">
                Contacta al administrador para asignar cursos a tu cuenta
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg">
                {/* Gradient Header */}
                <div className={`h-24 bg-gradient-to-r ${gradients[index % gradients.length]} relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                    <div>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-2">
                        {course.code}
                      </Badge>
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {course.name}
                      </h3>
                    </div>
                    {course.hasActiveSession && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Badge className="bg-green-500 border-green-400 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                          EN VIVO
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                      <div className="p-2 rounded-lg bg-blue-500 text-white">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{course.studentCount}</p>
                        <p className="text-xs text-muted-foreground">Estudiantes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                      <div className="p-2 rounded-lg bg-purple-500 text-white">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{course.totalSessions}</p>
                        <p className="text-xs text-muted-foreground">Sesiones</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Asistencia promedio</span>
                      </div>
                      <span className={`text-lg font-bold ${course.avgAttendance >= 80 ? 'text-emerald-600' : course.avgAttendance >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {course.avgAttendance}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full bg-gradient-to-r ${getAttendanceColor(course.avgAttendance)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${course.avgAttendance}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Schedule */}
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {course.schedule || 'Sin horario definido'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {course.hasActiveSession && course.activeSessionId ? (
                      <Button 
                        onClick={() => endSession(course.activeSessionId!, course.name)}
                        className="flex-1 gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg"
                      >
                        <StopCircle className="h-4 w-4" />
                        Terminar Clase
                      </Button>
                    ) : (
                      <Link href={`/professor/sessions/new?course=${course.id}`} className="flex-1">
                        <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                          <Sparkles className="h-4 w-4" />
                          Iniciar Clase
                        </Button>
                      </Link>
                    )}
                    <Link href={`/professor/courses/${course.id}`}>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/professor/courses/${course.id}/stats`}>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <BarChart2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
