export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, classSessions, enrollments } from '@/lib/db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Get professor's courses
    const professorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.professorId, session.user.id));

    if (professorCourses.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = professorCourses.map(c => c.id);

    // Get past sessions in date range
    let sessions = await db
      .select({
        id: classSessions.id,
        courseId: classSessions.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        startTime: classSessions.startedAt
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(sql`${classSessions.courseId} IN ${courseIds}`);

    if (startDate && endDate) {
      sessions = sessions.filter(s => {
        const date = new Date(s.startTime);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }

    // Get student counts
    const result = await Promise.all(
      sessions.map(async (s) => {
        const enrolled = await db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, s.courseId));

        return {
          id: s.id,
          courseId: s.courseId,
          courseName: s.courseName,
          courseCode: s.courseCode,
          date: s.startTime,
          time: format(new Date(s.startTime), 'HH:mm'),
          studentCount: enrolled[0]?.count || 0
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calendar error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
