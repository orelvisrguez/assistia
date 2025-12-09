'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, User, Clock, TrendingUp, CheckCircle2,
  XCircle, Calendar, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  professorName: string;
  schedule: string;
  attendanceRate: number;
  totalPresent: number;
  totalSessions: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export default function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/student/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'excellent':
        return { color: 'from-green-500 to-emerald-600', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600', label: 'Excelente' };
      case 'good':
        return { color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600', label: 'Bueno' };
      case 'warning':
        return { color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600', label: 'Atención' };
      default:
        return { color: 'from-red-500 to-rose-600', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600', label: 'Crítico' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Cursos</h1>
        <p className="text-muted-foreground">Revisa tu progreso de asistencia en cada curso</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No estás inscrito en ningún curso</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course, index) => {
            const statusConfig = getStatusConfig(course.status);
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/student/courses/${course.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden h-full">
                    <div className={`h-2 bg-gradient-to-r ${statusConfig.color}`} />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">{course.code}</Badge>
                          <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
                            {course.name}
                          </h3>
                        </div>
                        <Badge className={statusConfig.bg + ' ' + statusConfig.text}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Prof. {course.professorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{course.schedule}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Asistencia
                          </span>
                          <span className={`font-bold ${statusConfig.text}`}>
                            {course.attendanceRate}%
                          </span>
                        </div>
                        <Progress value={course.attendanceRate} className="h-2" />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            {course.totalPresent}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" />
                            {course.totalSessions - course.totalPresent}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
