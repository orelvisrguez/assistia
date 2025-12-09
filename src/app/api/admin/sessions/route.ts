import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions, courses, users, attendanceRecords } from '@/lib/db';
import { eq, count, and } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const activeSessions = await db
      .select({
        id: classSessions.id,
        courseName: courses.name,
        courseCode: courses.code,
        professorName: users.name,
        professorEmail: users.email,
        startedAt: classSessions.startedAt,
        location: courses.location,
        attendanceCount: count(attendanceRecords.id),
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .innerJoin(users, eq(classSessions.professorId, users.id))
      .leftJoin(attendanceRecords, eq(classSessions.id, attendanceRecords.sessionId))
      .where(eq(classSessions.isActive, true))
      .groupBy(classSessions.id, courses.id, users.id);

    return NextResponse.json({ sessions: activeSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
