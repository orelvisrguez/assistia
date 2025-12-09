import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth/config';
import { db, attendanceRecords, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'professor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID requerido' }, { status: 400 });
  }

  const records = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      studentName: users.name,
      markedAt: attendanceRecords.markedAt,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .innerJoin(users, eq(attendanceRecords.studentId, users.id))
    .where(eq(attendanceRecords.sessionId, sessionId))
    .orderBy(attendanceRecords.markedAt);

  return NextResponse.json({ records });
}
