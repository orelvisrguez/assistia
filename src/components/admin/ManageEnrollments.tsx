'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Course, User } from '@/lib/db/schema';

interface ManageEnrollmentsProps {
  course: Course;
  students: User[];
}

interface Enrollment {
  id: string;
  studentId: string;
}

export function ManageEnrollments({ course, students }: ManageEnrollmentsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchEnrollments();
    }
  }, [open]);

  async function fetchEnrollments() {
    const res = await fetch(`/api/admin/courses/${course.id}/enrollments`);
    if (res.ok) {
      const data = await res.json();
      setEnrollments(data.enrollments);
      setSelectedStudents(new Set(data.enrollments.map((e: Enrollment) => e.studentId)));
    }
  }

  function toggleStudent(studentId: string) {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudents(newSet);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/enrollments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });

      if (res.ok) {
        toast.success('Inscripciones actualizadas');
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        Gestionar Inscripciones
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8">
            <CardHeader>
              <CardTitle>Inscripciones - {course.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona los estudiantes a inscribir en este curso.
              </p>
              
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No hay estudiantes registrados</p>
                ) : (
                  students.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      {selectedStudents.has(student.id) && (
                        <Badge variant="success">Inscrito</Badge>
                      )}
                    </label>
                  ))
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedStudents.size} estudiante(s) seleccionado(s)
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
