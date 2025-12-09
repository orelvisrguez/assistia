import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    // Get professor's courses
    const professorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.professorId, session.user.id));

    const courseIds = professorCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        records: [],
        stats: { totalRecords: 0, presentCount: 0, lateCount: 0, absentCount: 0, avgAttendanceRate: 0 }
      });
    }

    // Build query conditions
    let conditions = sql`${classSessions.courseId} IN ${courseIds}`;
    
    if (courseId && courseId !== 'all') {
      conditions = and(conditions, eq(classSessions.courseId, courseId))!;
    }

    // Get records
    let records = await db
      .select({
        id: attendanceRecords.id,
        studentName: users.name,
        studentEmail: users.email,
        courseName: courses.name,
        courseCode: courses.code,
        sessionDate: classSessions.startedAt,
        status: attendanceRecords.status,
        checkInTime: attendanceRecords.markedAt
      })
      .from(attendanceRecords)
      .innerJoin(users, eq(attendanceRecords.studentId, users.id))
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(conditions)
      .orderBy(desc(attendanceRecords.markedAt))
      .limit(500);

    // Filter by status if provided
    if (status && status !== 'all') {
      records = records.filter(r => r.status === status);
    }

    // Format records
    const formattedRecords = records.map(r => ({
      id: r.id,
      studentName: r.studentName || 'Sin nombre',
      studentEmail: r.studentEmail,
      courseName: r.courseName,
      courseCode: r.courseCode,
      sessionDate: format(new Date(r.sessionDate), "d 'de' MMMM, yyyy", { locale: es }),
      status: r.status,
      checkInTime: r.checkInTime ? format(new Date(r.checkInTime), 'HH:mm') : null
    }));

    // Calculate stats
    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const totalRecords = records.length;
    const avgAttendanceRate = totalRecords > 0 
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100) 
      : 0;

    return NextResponse.json({
      records: formattedRecords,
      stats: {
        totalRecords,
        presentCount,
        lateCount,
        absentCount: totalRecords - presentCount - lateCount,
        avgAttendanceRate
      }
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
