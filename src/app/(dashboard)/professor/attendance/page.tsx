'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Download, Filter, Search, Calendar,
  CheckCircle2, XCircle, Clock, Users, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCode: string;
  sessionDate: string;
  status: 'present' | 'late' | 'absent';
  checkInTime: string | null;
}

interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  avgAttendanceRate: number;
}

export default function ProfessorAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    avgAttendanceRate: 0
  });
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchAttendance();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedCourse, statusFilter]);

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

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse !== 'all') params.append('courseId', selectedCourse);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/professor/attendance?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Estudiante', 'Email', 'Curso', 'Fecha', 'Estado', 'Hora de Registro'];
    const csvData = records.map(r => [
      r.studentName,
      r.studentEmail,
      `${r.courseCode} - ${r.courseName}`,
      r.sessionDate,
      r.status,
      r.checkInTime || 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const filteredRecords = records.filter(r => 
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Presente</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Tardanza</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ausente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statCards = [
    { title: 'Total Registros', value: stats.totalRecords, icon: Users, color: 'text-blue-500' },
    { title: 'Presentes', value: stats.presentCount, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Tardanzas', value: stats.lateCount, icon: Clock, color: 'text-yellow-500' },
    { title: 'Tasa Promedio', value: `${stats.avgAttendanceRate}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control de Asistencia</h1>
          <p className="text-muted-foreground">Historial completo de asistencia por curso</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="present">Presente</SelectItem>
                <SelectItem value="late">Tardanza</SelectItem>
                <SelectItem value="absent">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No hay registros de asistencia
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.studentName}</p>
                        <p className="text-sm text-muted-foreground">{record.studentEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.courseCode}</Badge>
                      <p className="text-sm mt-1">{record.courseName}</p>
                    </TableCell>
                    <TableCell>{record.sessionDate}</TableCell>
                    <TableCell>{record.checkInTime || '-'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
