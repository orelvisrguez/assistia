import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions, courses, users, attendanceRecords, enrollments } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const filter = request.nextUrl.searchParams.get('filter') || 'all';
    const logs: Array<{
      id: string;
      type: string;
      action: string;
      details: string;
      user: string;
      timestamp: string;
    }> = [];

    // Fetch sessions
    if (filter === 'all' || filter === 'session') {
      const sessions = await db
        .select({
          id: classSessions.id,
          startedAt: classSessions.startedAt,
          endedAt: classSessions.endedAt,
          isActive: classSessions.isActive,
          courseName: courses.name,
          professorName: users.name,
        })
        .from(classSessions)
        .innerJoin(courses, eq(classSessions.courseId, courses.id))
        .innerJoin(users, eq(classSessions.professorId, users.id))
        .orderBy(desc(classSessions.startedAt))
        .limit(50);

      for (const s of sessions) {
        logs.push({
          id: `session-start-${s.id}`,
          type: 'session',
          action: 'Sesión Iniciada',
          details: `Curso: ${s.courseName}`,
          user: s.professorName,
          timestamp: s.startedAt.toISOString(),
        });
        if (s.endedAt) {
          logs.push({
            id: `session-end-${s.id}`,
            type: 'session',
            action: 'Sesión Finalizada',
            details: `Curso: ${s.courseName}`,
            user: s.professorName,
            timestamp: s.endedAt.toISOString(),
          });
        }
      }
    }

    // Fetch attendance
    if (filter === 'all' || filter === 'attendance') {
      const attendance = await db
        .select({
          id: attendanceRecords.id,
          status: attendanceRecords.status,
          markedAt: attendanceRecords.markedAt,
          studentName: users.name,
          courseName: courses.name,
        })
        .from(attendanceRecords)
        .innerJoin(users, eq(attendanceRecords.studentId, users.id))
        .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
        .innerJoin(courses, eq(classSessions.courseId, courses.id))
        .orderBy(desc(attendanceRecords.markedAt))
        .limit(50);

      for (const a of attendance) {
        const statusLabel = a.status === 'present' ? 'Presente' : a.status === 'late' ? 'Tarde' : 'Ausente';
        logs.push({
          id: `attendance-${a.id}`,
          type: 'attendance',
          action: `Asistencia: ${statusLabel}`,
          details: `Curso: ${a.courseName}`,
          user: a.studentName,
          timestamp: a.markedAt.toISOString(),
        });
      }
    }

    // Fetch users
    if (filter === 'all' || filter === 'user') {
      const recentUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(30);

      for (const u of recentUsers) {
        const roleLabel = u.role === 'professor' ? 'Profesor' : u.role === 'student' ? 'Estudiante' : 'Administrador';
        logs.push({
          id: `user-${u.id}`,
          type: 'user',
          action: 'Usuario Creado',
          details: `Rol: ${roleLabel}`,
          user: u.name,
          timestamp: u.createdAt.toISOString(),
        });
      }
    }

    // Sort by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ logs: logs.slice(0, 100) });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
