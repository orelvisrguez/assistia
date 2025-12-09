// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

interface CourseStats {
  course: {
    name: string;
    code: string;
  };
  attendanceBySession: Array<{
    session: string;
    date: string;
    present: number;
    absent: number;
    rate: number;
  }>;
  attendanceDistribution: Array<{
    name: string;
    value: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    rate: number;
  }>;
  topStudents: Array<{
    name: string;
    rate: number;
  }>;
  lowAttendance: Array<{
    name: string;
    rate: number;
  }>;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function CourseStats() {
  const params = useParams();
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [params.id]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/professor/courses/${params.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-1/3"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  if (!stats) {
    return <div className="text-center py-12">No se encontraron estadísticas</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-2">{stats.course.code}</Badge>
        <h1 className="text-3xl font-bold">Estadísticas del Curso</h1>
        <p className="text-muted-foreground">{stats.course.name}</p>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by Session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Asistencia por Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.attendanceBySession}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Presentes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Ausentes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Tasa de Asistencia"
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top & Low Students */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-600">Mejor Asistencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topStudents.map((student, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded bg-green-50 dark:bg-green-950">
                    <span className="font-medium">{student.name}</span>
                    <Badge className="bg-green-500">{student.rate}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-600">Requieren Atención</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.lowAttendance.map((student, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded bg-red-50 dark:bg-red-950">
                    <span className="font-medium">{student.name}</span>
                    <Badge variant="destructive">{student.rate}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
