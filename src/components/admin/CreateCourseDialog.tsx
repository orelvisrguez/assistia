'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/db/schema';

interface CreateCourseDialogProps {
  professors: User[];
}

export function CreateCourseDialog({ professors }: CreateCourseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Curso creado exitosamente');
        setOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Error al crear curso');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Curso
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg my-8">
        <CardHeader>
          <CardTitle>Crear Nuevo Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Curso</label>
                <Input name="name" required placeholder="Programación Web" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input name="code" required placeholder="INF-301" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Descripción del curso..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profesor Asignado</label>
              <select
                name="professorId"
                required
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Seleccionar profesor...</option>
                {professors.map((prof) => (
                  <option key={prof.id} value={prof.id}>{prof.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación</label>
                <Input name="location" placeholder="Aula 201" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horario</label>
                <Input name="schedule" placeholder="Lun/Mié 10:00-12:00" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creando...' : 'Crear Curso'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
