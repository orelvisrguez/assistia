import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, courses } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface Params {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, code, description, professorId, location, schedule } = body;

  const [updated] = await db
    .update(courses)
    .set({ name, code, description, professorId, location, schedule })
    .where(eq(courses.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ course: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  await db.delete(courses).where(eq(courses.id, params.id));

  return NextResponse.json({ success: true });
}
