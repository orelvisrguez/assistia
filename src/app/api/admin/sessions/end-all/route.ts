import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await db
      .update(classSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(classSessions.isActive, true))
      .returning({ id: classSessions.id });

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error('Error ending all sessions:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
