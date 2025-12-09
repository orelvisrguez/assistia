export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

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

    // Get enrolled students
    const enrolledStudents = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.courseId, params.id));

    // Get total sessions
    const sessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(classSessions)
      .where(eq(classSessions.courseId, params.id));

    const totalSessions = sessions[0]?.count || 0;

    // Get attendance stats per student
    const studentsWithStats = await Promise.all(
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

        const totalPresent = attendance[0]?.count || 0;
        const attendanceRate = totalSessions > 0 
          ? Math.round((totalPresent / totalSessions) * 100) 
          : 0;

        return {
          id: student.id,
          name: student.name || 'Sin nombre',
          email: student.email,
          totalPresent,
          totalSessions,
          attendanceRate
        };
      })
    );

    // Calculate average attendance
    const avgAttendance = studentsWithStats.length > 0
      ? Math.round(studentsWithStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsWithStats.length)
      : 0;

    return NextResponse.json({
      course: {
        id: course[0].id,
        name: course[0].name,
        code: course[0].code,
        schedule: course[0].schedule || 'Sin horario',
        studentCount: enrolledStudents.length,
        totalSessions,
        avgAttendance
      },
      students: studentsWithStats
    });
  } catch (error) {
    console.error('Course details error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
