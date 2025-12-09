'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course, User } from '@/lib/db/schema';

interface CourseActionsProps {
  course: Course;
  professors: User[];
}

export function CourseActions({ course, professors }: CourseActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      professorId: formData.get('professorId') as string,
      location: formData.get('location') as string,
      schedule: formData.get('schedule') as string,
    };

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Curso actualizado');
        setEditOpen(false);
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

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Curso eliminado');
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Editar Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input name="name" defaultValue={course.name} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código</label>
                    <Input name="code" defaultValue={course.code} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={course.description || ''}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profesor</label>
                  <select
                    name="professorId"
                    defaultValue={course.professorId}
                    required
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {professors.map((prof) => (
                      <option key={prof.id} value={prof.id}>{prof.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ubicación</label>
                    <Input name="location" defaultValue={course.location || ''} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Horario</label>
                    <Input name="schedule" defaultValue={course.schedule || ''} />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Eliminar Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>¿Eliminar <strong>{course.name}</strong>?</p>
              <p className="text-sm text-muted-foreground">Se eliminarán todas las inscripciones y registros de asistencia.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
