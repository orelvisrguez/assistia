import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.id;

    // Get enrolled courses with professor info
    const enrolledCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        schedule: courses.schedule,
        professorName: users.name
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(courses.professorId, users.id))
      .where(eq(enrollments.studentId, studentId));

    const coursesWithStats = await Promise.all(
      enrolledCourses.map(async (course) => {
        // Get total sessions for this course
        const sessions = await db
          .select({ count: sql<number>`count(*)` })
          .from(classSessions)
          .where(eq(classSessions.courseId, course.id));

        const totalSessions = sessions[0]?.count || 0;

        // Get student's attendance for this course
        const attendance = await db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
          .where(and(
            eq(classSessions.courseId, course.id),
            eq(attendanceRecords.studentId, studentId),
            sql`${attendanceRecords.status} IN ('present', 'late')`
          ));

        const totalPresent = attendance[0]?.count || 0;
        const attendanceRate = totalSessions > 0 
          ? Math.round((totalPresent / totalSessions) * 100) 
          : 100;

        // Determine status
        let status: 'excellent' | 'good' | 'warning' | 'danger' = 'excellent';
        if (attendanceRate < 60) status = 'danger';
        else if (attendanceRate < 75) status = 'warning';
        else if (attendanceRate < 90) status = 'good';

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          professorName: course.professorName || 'Profesor',
          schedule: course.schedule || 'Sin horario definido',
          attendanceRate,
          totalPresent,
          totalSessions,
          status
        };
      })
    );

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
