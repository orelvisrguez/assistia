import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { courses, enrollments, classSessions, attendanceRecords, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = params.id;

    // Verify student is enrolled in this course
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.studentId, session.user.id)
        )
      )
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json({ error: 'No inscrito en este curso' }, { status: 403 });
    }

    // Get course details with professor
    const courseData = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        schedule: courses.schedule,
        professorId: courses.professorId,
        professorName: users.name,
      })
      .from(courses)
      .leftJoin(users, eq(courses.professorId, users.id))
      .where(eq(courses.id, courseId))
      .limit(1);

    if (courseData.length === 0) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const course = courseData[0];

    // Get all sessions for this course
    const courseSessionsList = await db
      .select({
        id: classSessions.id,
        startedAt: classSessions.startedAt,
        endedAt: classSessions.endedAt,
        isActive: classSessions.isActive,
      })
      .from(classSessions)
      .where(eq(classSessions.courseId, courseId))
      .orderBy(desc(classSessions.startedAt));

    // Get attendance records for this student
    const attendances = await db
      .select({
        sessionId: attendanceRecords.sessionId,
        status: attendanceRecords.status,
        markedAt: attendanceRecords.markedAt,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, session.user.id));

    const attendanceMap = new Map(attendances.map(a => [a.sessionId, a]));

    // Combine sessions with attendance info
    const sessionsWithAttendance = courseSessionsList.map(s => {
      const attendance = attendanceMap.get(s.id);
      const isCompleted = !s.isActive && s.endedAt;
      return {
        id: s.id,
        date: s.startedAt?.toISOString().split('T')[0] || '',
        startTime: s.startedAt?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '',
        endTime: s.endedAt?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '-',
        sessionStatus: s.isActive ? 'active' : 'completed',
        attendanceStatus: attendance?.status || (isCompleted ? 'absent' : 'pending'),
        timestamp: attendance?.markedAt || null,
      };
    });

    // Calculate stats
    const completedSessions = courseSessionsList.filter(s => !s.isActive).length;
    const presentCount = attendances.filter(a => 
      a.status === 'present' && courseSessionsList.some(s => s.id === a.sessionId)
    ).length;
    const lateCount = attendances.filter(a => 
      a.status === 'late' && courseSessionsList.some(s => s.id === a.sessionId)
    ).length;
    const absentCount = Math.max(0, completedSessions - presentCount - lateCount);
    const attendanceRate = completedSessions > 0 
      ? Math.round(((presentCount + lateCount * 0.5) / completedSessions) * 100) 
      : 100;

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        schedule: course.schedule || 'No especificado',
        professorName: course.professorName || 'Sin asignar',
      },
      stats: {
        totalSessions: courseSessionsList.length,
        completedSessions,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate,
      },
      sessions: sessionsWithAttendance,
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
