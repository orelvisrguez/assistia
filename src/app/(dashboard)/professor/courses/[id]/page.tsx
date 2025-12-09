'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, Users, Calendar, TrendingUp, Mail, 
  CheckCircle2, Clock, XCircle, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface CourseDetails {
  id: string;
  name: string;
  code: string;
  schedule: string;
  studentCount: number;
  totalSessions: number;
  avgAttendance: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  attendanceRate: number;
  totalPresent: number;
  totalSessions: number;
}

export default function CourseDetails() {
  const params = useParams();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [params.id]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`/api/professor/courses/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportStudentList = () => {
    const headers = ['Nombre', 'Email', 'Asistencias', 'Total Sesiones', 'Tasa %'];
    const csvData = students.map(s => [
      s.name, s.email, s.totalPresent, s.totalSessions, s.attendanceRate
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estudiantes_${course?.code}.csv`;
    link.click();
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-1/3"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  if (!course) {
    return <div className="text-center py-12">Curso no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Badge variant="outline" className="mb-2">{course.code}</Badge>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.schedule}</p>
        </div>
        <Button onClick={exportStudentList} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Lista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Estudiantes</p>
              <p className="text-2xl font-bold">{course.studentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Sesiones</p>
              <p className="text-2xl font-bold">{course.totalSessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Asistencia Prom.</p>
              <p className="text-2xl font-bold">{course.avgAttendance}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Progreso</p>
            <Progress value={course.avgAttendance} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Asistencias</TableHead>
                <TableHead className="text-center">Tasa</TableHead>
                <TableHead>Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay estudiantes inscritos
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${student.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.totalPresent}/{student.totalSessions}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${getAttendanceColor(student.attendanceRate)}`}>
                        {student.attendanceRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={student.attendanceRate} className="h-2" />
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
