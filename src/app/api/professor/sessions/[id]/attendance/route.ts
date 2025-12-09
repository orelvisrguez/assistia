export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { classSessions, courses, attendanceRecords, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
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

    // Verify session belongs to professor
    const classSession = await db
      .select({
        id: classSessions.id,
        professorId: courses.professorId
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(eq(classSessions.id, params.id))
      .limit(1);

    if (!classSession[0] || classSession[0].professorId !== session.user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const records = await db
      .select({
        id: attendanceRecords.id,
        studentName: users.name,
        studentEmail: users.email,
        checkInTime: attendanceRecords.markedAt,
        status: attendanceRecords.status
      })
      .from(attendanceRecords)
      .innerJoin(users, eq(attendanceRecords.studentId, users.id))
      .where(eq(attendanceRecords.sessionId, params.id))
      .orderBy(attendanceRecords.markedAt);

    const formattedRecords = records.map(r => ({
      id: r.id,
      studentName: r.studentName || 'Sin nombre',
      studentEmail: r.studentEmail,
      timestamp: r.checkInTime ? format(new Date(r.checkInTime), 'HH:mm:ss') : '',
      status: r.status
    }));

    return NextResponse.json({
      records: formattedRecords,
      count: records.length
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
