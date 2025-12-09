import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateQRPayload } from '@/lib/qr/crypto';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'professor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID requerido' }, { status: 400 });
  }

  const [classSession] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, sessionId))
    .limit(1);

  if (!classSession || !classSession.isActive) {
    return NextResponse.json({ error: 'Sesión no encontrada o inactiva' }, { status: 404 });
  }

  if (classSession.professorId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado para esta sesión' }, { status: 403 });
  }

  const payload = generateQRPayload(sessionId, classSession.qrSecret);

  return NextResponse.json({ payload });
}
