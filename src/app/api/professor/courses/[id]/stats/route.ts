export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = await db
      .select()
      .from(courses)
      .where(and(
        eq(courses.id, params.id),
        eq(courses.professorId, session.user.id)
      ))
      .limit(1);

    if (!course[0]) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all sessions
    const sessions = await db
      .select({
        id: classSessions.id,
        startTime: classSessions.startedAt
      })
      .from(classSessions)
      .where(eq(classSessions.courseId, params.id))
      .orderBy(classSessions.startedAt);

    // Get enrolled count
    const enrolledCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.courseId, params.id));

    const totalStudents = enrolledCount[0]?.count || 0;

    // Attendance by session
    const attendanceBySession = await Promise.all(
      sessions.slice(-10).map(async (s, index) => {
        const attendance = await db
          .select({
            present: sql<number>`count(case when ${attendanceRecords.status} IN ('present', 'late') then 1 end)`,
            absent: sql<number>`count(case when ${attendanceRecords.status} = 'absent' then 1 end)`
          })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.sessionId, s.id));

        const present = attendance[0]?.present || 0;
        const absent = totalStudents - present;

        return {
          session: `S${index + 1}`,
          date: format(new Date(s.startTime), 'dd/MM'),
          present,
          absent,
          rate: totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0
        };
      })
    );

    // Calculate overall distribution
    const totalPresent = attendanceBySession.reduce((sum, s) => sum + s.present, 0);
    const totalLate = 0; // Simplified
    const totalAbsent = attendanceBySession.reduce((sum, s) => sum + s.absent, 0);

    const attendanceDistribution = [
      { name: 'Presentes', value: totalPresent },
      { name: 'Tardanzas', value: totalLate },
      { name: 'Ausentes', value: totalAbsent }
    ].filter(d => d.value > 0);

    // Weekly trend (last 8 weeks simulated)
    const weeklyTrend = attendanceBySession.slice(-8).map((s, i) => ({
      week: `Sem ${i + 1}`,
      rate: s.rate
    }));

    // Get student attendance rates
    const enrolledStudents = await db
      .select({
        id: users.id,
        name: users.name
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, params.id));

    const studentRates = await Promise.all(
      enrolledStudents.map(async (student) => {
        const attendance = await db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
          .where(and(
            eq(classSessions.courseId, params.id),
            eq(attendanceRecords.studentId, student.id),
            sql`${attendanceRecords.status} IN ('present', 'late')`
          ));

        const totalSessions = sessions.length;
        const present = attendance[0]?.count || 0;
        const rate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

        return { name: student.name || 'Sin nombre', rate };
      })
    );

    // Sort and get top/low
    const sorted = [...studentRates].sort((a, b) => b.rate - a.rate);
    const topStudents = sorted.slice(0, 5);
    const lowAttendance = sorted.filter(s => s.rate < 70).slice(0, 5);

    return NextResponse.json({
      course: {
        name: course[0].name,
        code: course[0].code
      },
      attendanceBySession,
      attendanceDistribution,
      weeklyTrend,
      topStudents,
      lowAttendance
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
