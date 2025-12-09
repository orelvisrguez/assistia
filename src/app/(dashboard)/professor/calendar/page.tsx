'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, BookOpen, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduledClass {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  date: string;
  time: string;
  studentCount: number;
}

export default function ProfessorCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [currentMonth]);

  const fetchSchedule = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const res = await fetch(`/api/professor/calendar?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getClassesForDay = (date: Date) => {
    return classes.filter(c => isSameDay(new Date(c.date), date));
  };

  const selectedDayClasses = selectedDate ? getClassesForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario de Clases</h1>
        <p className="text-muted-foreground">Visualiza y gestiona tu horario de clases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayClasses = getClassesForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasClasses = dayClasses.length > 0;

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      p-2 min-h-[80px] rounded-lg border text-left transition-all
                      ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-transparent hover:border-muted'}
                      ${isToday(day) ? 'bg-blue-50 dark:bg-blue-950' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    {hasClasses && (
                      <div className="mt-1 space-y-1">
                        {dayClasses.slice(0, 2).map((c) => (
                          <div key={c.id} className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded px-1 py-0.5 truncate">
                            {c.courseCode}
                          </div>
                        ))}
                        {dayClasses.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayClasses.length - 2} más</div>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-center py-8">
                Haz clic en un día para ver las clases programadas
              </p>
            ) : selectedDayClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay clases programadas para este día
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDayClasses.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline">{c.courseCode}</Badge>
                        <h4 className="font-medium mt-1">{c.courseName}</h4>
                      </div>
                      <Badge className="bg-indigo-500">{c.time}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{c.studentCount} estudiantes</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
