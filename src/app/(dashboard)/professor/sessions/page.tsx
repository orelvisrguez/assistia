'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Play, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Session {
  id: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  attendanceCount: number;
  totalStudents: number;
}

export default function ProfessorSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/professor/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'active') return s.isActive;
    if (filter === 'completed') return !s.isActive;
    return true;
  });

  const getAttendancePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historial de Sesiones</h1>
          <p className="text-muted-foreground">Gestiona y revisa tus sesiones de clase</p>
        </div>
        <Link href="/professor/sessions/new">
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Nueva Sesión
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Completadas'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay sesiones para mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${session.isActive ? 'border-green-500 border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${session.isActive ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                        {session.isActive ? <Play className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{session.courseName}</h3>
                          <Badge variant="outline">{session.courseCode}</Badge>
                          {session.isActive && (
                            <Badge className="bg-green-500 animate-pulse">EN VIVO</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.startTime), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(session.startTime), 'HH:mm')}
                            {session.endTime && ` - ${format(new Date(session.endTime), 'HH:mm')}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            {session.attendanceCount}/{session.totalStudents}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getAttendancePercentage(session.attendanceCount, session.totalStudents)}% asistencia
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {session.isActive ? (
                          <Link href={`/professor/sessions/new?resume=${session.id}`}>
                            <Button className="gap-2">
                              <Eye className="h-4 w-4" />
                              Ver Sesión
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/professor/sessions/${session.id}`}>
                            <Button variant="outline" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Detalles
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
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
