export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const professorId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get professor's courses
    const professorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.professorId, professorId));

    const courseIds = professorCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalCourses: 0,
          totalStudents: 0,
          activeSessions: 0,
          todayAttendance: 0,
          weeklyRate: 0
        },
        recentSessions: []
      });
    }

    // Total students enrolled
    const studentCount = await db
      .select({ count: sql<number>`count(DISTINCT ${enrollments.studentId})` })
      .from(enrollments)
      .where(sql`${enrollments.courseId} IN ${courseIds}`);

    // Active sessions
    const activeSessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(classSessions)
      .where(and(
        sql`${classSessions.courseId} IN ${courseIds}`,
        eq(classSessions.isActive, true)
      ));

    // Today's attendance
    const todayAttendance = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(and(
        sql`${classSessions.courseId} IN ${courseIds}`,
        gte(attendanceRecords.markedAt, today)
      ));

    // Weekly attendance rate
    const weeklyStats = await db
      .select({
        total: sql<number>`count(*)`,
        present: sql<number>`count(case when ${attendanceRecords.status} = 'present' then 1 end)`
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(and(
        sql`${classSessions.courseId} IN ${courseIds}`,
        gte(classSessions.startedAt, weekAgo)
      ));

    const weeklyRate = weeklyStats[0].total > 0 
      ? Math.round((weeklyStats[0].present / weeklyStats[0].total) * 100) 
      : 0;

    // Recent sessions
    const recentSessions = await db
      .select({
        id: classSessions.id,
        courseName: courses.name,
        startTime: classSessions.startedAt
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(sql`${classSessions.courseId} IN ${courseIds}`)
      .orderBy(desc(classSessions.startedAt))
      .limit(5);

    const sessionsWithAttendance = await Promise.all(
      recentSessions.map(async (s) => {
        const attendance = await db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.sessionId, s.id));

        const enrolled = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .innerJoin(classSessions, eq(enrollments.courseId, classSessions.courseId))
          .where(eq(classSessions.id, s.id));

        return {
          id: s.id,
          courseName: s.courseName,
          date: new Date(s.startTime).toLocaleDateString('es-ES'),
          attendanceCount: attendance[0]?.count || 0,
          totalStudents: enrolled[0]?.count || 0
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalCourses: courseIds.length,
        totalStudents: studentCount[0]?.count || 0,
        activeSessions: activeSessions[0]?.count || 0,
        todayAttendance: todayAttendance[0]?.count || 0,
        weeklyRate
      },
      recentSessions: sessionsWithAttendance
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
