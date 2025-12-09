import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.id;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const month = searchParams.get('month');

    // Get enrolled courses
    const enrolledCourses = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));

    const courseIds = enrolledCourses.map(e => e.courseId);

    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    // Build date range
    let startDate = startOfMonth(new Date());
    let endDate = endOfMonth(new Date());

    if (month) {
      const monthDate = parseISO(month + '-01');
      startDate = startOfMonth(monthDate);
      endDate = endOfMonth(monthDate);
    }

    // Build conditions
    let conditions = and(
      eq(attendanceRecords.studentId, studentId),
      sql`${classSessions.courseId} IN ${courseIds}`,
      gte(classSessions.startedAt, startDate),
      lte(classSessions.startedAt, endDate)
    );

    if (courseId && courseId !== 'all') {
      conditions = and(conditions, eq(classSessions.courseId, courseId));
    }

    // Get attendance records
    const records = await db
      .select({
        id: attendanceRecords.id,
        courseName: courses.name,
        courseCode: courses.code,
        date: classSessions.startedAt,
        checkInTime: attendanceRecords.markedAt,
        status: attendanceRecords.status
      })
      .from(attendanceRecords)
      .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(conditions!)
      .orderBy(desc(classSessions.startedAt));

    const formattedRecords = records.map(r => ({
      id: r.id,
      courseName: r.courseName,
      courseCode: r.courseCode,
      date: r.date,
      time: r.checkInTime ? format(new Date(r.checkInTime), 'HH:mm') : '-',
      status: r.status
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
