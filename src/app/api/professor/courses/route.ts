export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const professorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.professorId, session.user.id));

    const coursesWithStats = await Promise.all(
      professorCourses.map(async (course) => {
        // Student count
        const students = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        // Total sessions
        const sessions = await db
          .select({ count: sql<number>`count(*)` })
          .from(classSessions)
          .where(eq(classSessions.courseId, course.id));

        // Active session check
        const activeSession = await db
          .select({ id: classSessions.id })
          .from(classSessions)
          .where(and(
            eq(classSessions.courseId, course.id),
            eq(classSessions.isActive, true)
          ))
          .limit(1);

        // Average attendance
        const attendanceStats = await db
          .select({
            total: sql<number>`count(*)`,
            present: sql<number>`count(case when ${attendanceRecords.status} = 'present' then 1 end)`
          })
          .from(attendanceRecords)
          .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
          .where(eq(classSessions.courseId, course.id));

        const avgAttendance = attendanceStats[0].total > 0
          ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
          : 0;

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          schedule: course.schedule || 'Sin horario definido',
          studentCount: students[0]?.count || 0,
          totalSessions: sessions[0]?.count || 0,
          avgAttendance,
          hasActiveSession: activeSession.length > 0
        };
      })
    );

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
