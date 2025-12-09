import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth/config';
import { db, courses } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, code, description, professorId, location, schedule } = body;

  if (!name || !code || !professorId) {
    return NextResponse.json({ message: 'Nombre, código y profesor son requeridos' }, { status: 400 });
  }

  // Check if code exists
  const existing = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ message: 'El código de curso ya existe' }, { status: 400 });
  }

  const [newCourse] = await db.insert(courses).values({
    name,
    code,
    description,
    professorId,
    location,
    schedule,
  }).returning();

  return NextResponse.json({ course: newCourse });
}
