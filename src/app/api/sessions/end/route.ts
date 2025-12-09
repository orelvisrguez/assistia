import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'professor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID requerido' }, { status: 400 });
  }

  const [updated] = await db
    .update(classSessions)
    .set({ isActive: false, endedAt: new Date() })
    .where(and(
      eq(classSessions.id, sessionId),
      eq(classSessions.professorId, session.user.id)
    ))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
