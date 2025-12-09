import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, users, courses, enrollments, attendanceRecords, classSessions } from '@/lib/db';
import { count, eq, and, gte, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // User stats
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [adminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
    const [professorCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'professor'));
    const [studentCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'student'));

    // Course stats
    const [courseCount] = await db.select({ count: count() }).from(courses);
    const [enrollmentCount] = await db.select({ count: count() }).from(enrollments);

    // Active sessions
    const [activeSessionCount] = await db
      .select({ count: count() })
      .from(classSessions)
      .where(eq(classSessions.isActive, true));

    // Attendance stats
    const [totalAttendance] = await db.select({ count: count() }).from(attendanceRecords);
    const [presentCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.status, 'present'));
    const [lateCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.status, 'late'));
    const [absentCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.status, 'absent'));

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayAttendance] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(gte(attendanceRecords.markedAt, today));

    // Recent activities (last 20 events)
    const recentSessions = await db
      .select({
        id: classSessions.id,
        courseName: courses.name,
        professorName: users.name,
        startedAt: classSessions.startedAt,
        endedAt: classSessions.endedAt,
        isActive: classSessions.isActive,
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .innerJoin(users, eq(classSessions.professorId, users.id))
      .orderBy(desc(classSessions.startedAt))
      .limit(10);

    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Build activities array
    const activities: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
    }> = [];

    for (const session of recentSessions) {
      if (session.isActive) {
        activities.push({
          id: `session-start-${session.id}`,
          type: 'session_started',
          message: `${session.professorName} inició clase de ${session.courseName}`,
          timestamp: session.startedAt.toISOString(),
        });
      } else if (session.endedAt) {
        activities.push({
          id: `session-end-${session.id}`,
          type: 'session_ended',
          message: `Sesión de ${session.courseName} finalizada`,
          timestamp: session.endedAt.toISOString(),
        });
      }
    }

    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_created',
        message: `Nuevo ${user.role === 'professor' ? 'profesor' : user.role === 'student' ? 'estudiante' : 'administrador'}: ${user.name}`,
        timestamp: user.createdAt.toISOString(),
      });
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers.count,
          admins: adminCount.count,
          professors: professorCount.count,
          students: studentCount.count,
        },
        courses: courseCount.count,
        enrollments: enrollmentCount.count,
        activeSessions: activeSessionCount.count,
        todayAttendance: todayAttendance.count,
        attendance: {
          total: totalAttendance.count,
          present: presentCount.count,
          late: lateCount.count,
          absent: absentCount.count,
        },
      },
      activities: activities.slice(0, 15),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
