import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [classSession] = await db
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.id, id), eq(classSessions.isActive, true)));

    if (!classSession) {
      return NextResponse.json({ error: 'Sesión no encontrada o ya terminada' }, { status: 404 });
    }

    await db
      .update(classSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(classSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
