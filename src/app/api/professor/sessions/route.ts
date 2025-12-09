export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, classSessions, attendanceRecords, enrollments } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const professorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.professorId, session.user.id));

    const courseIds = professorCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    const sessions = await db
      .select({
        id: classSessions.id,
        courseId: classSessions.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        startTime: classSessions.startedAt,
        endTime: classSessions.endedAt,
        isActive: classSessions.isActive
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(sql`${classSessions.courseId} IN ${courseIds}`)
      .orderBy(desc(classSessions.startedAt));

    const sessionsWithStats = await Promise.all(
      sessions.map(async (s) => {
        const attendance = await db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.sessionId, s.id));

        const enrolled = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, s.courseId));

        return {
          ...s,
          attendanceCount: attendance[0]?.count || 0,
          totalStudents: enrolled[0]?.count || 0
        };
      })
    );

    return NextResponse.json(sessionsWithStats);
  } catch (error) {
    console.error('Sessions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
