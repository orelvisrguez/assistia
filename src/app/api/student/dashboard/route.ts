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

    // Get enrolled courses
    const enrolledCourses = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));

    const courseIds = enrolledCourses.map(e => e.courseId);

    if (courseIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalCourses: 0,
          attendanceRate: 0,
          totalPresent: 0,
          totalSessions: 0,
          streak: 0,
          rank: 'Bronce'
        },
        activeSessions: [],
        upcomingClasses: []
      });
    }

    // Get attendance stats
    const attendanceStats = await db
      .select({
        total: sql<number>`count(*)`,
        present: sql<number>`count(case when ${attendanceRecords.status} IN ('present', 'late') then 1 end)`
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .where(and(
        eq(attendanceRecords.studentId, studentId),
        sql`${classSessions.courseId} IN ${courseIds}`
      ));

    const totalSessions = attendanceStats[0]?.total || 0;
    const totalPresent = attendanceStats[0]?.present || 0;
    const attendanceRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    // Determine rank
    let rank = 'Bronce';
    if (attendanceRate >= 95) rank = 'Oro';
    else if (attendanceRate >= 80) rank = 'Plata';

    // Get active sessions
    const activeSessions = await db
      .select({
        id: classSessions.id,
        courseName: courses.name,
        courseCode: courses.code,
        professorName: users.name,
        startTime: classSessions.startedAt
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .innerJoin(users, eq(courses.professorId, users.id))
      .where(and(
        sql`${classSessions.courseId} IN ${courseIds}`,
        eq(classSessions.isActive, true)
      ));

    const formattedActiveSessions = activeSessions.map(s => ({
      id: s.id,
      courseName: s.courseName,
      courseCode: s.courseCode,
      professorName: s.professorName || 'Profesor',
      startTime: new Date(s.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }));

    // Get upcoming classes (courses info)
    const upcomingClasses = await db
      .select({
        id: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        schedule: courses.schedule
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId))
      .limit(3);

    return NextResponse.json({
      stats: {
        totalCourses: courseIds.length,
        attendanceRate,
        totalPresent,
        totalSessions,
        streak: Math.min(totalPresent, 7), // Simplified streak
        rank
      },
      activeSessions: formattedActiveSessions,
      upcomingClasses: upcomingClasses.map(c => ({
        id: c.id,
        courseName: c.courseName,
        courseCode: c.courseCode,
        schedule: c.schedule || 'Por definir',
        nextClass: 'Próximamente'
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
