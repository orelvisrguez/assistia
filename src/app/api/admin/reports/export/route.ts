export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, courses, users, attendanceRecords, classSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get('format') || 'csv';

  // Get all attendance data with related info
  const data = await db
    .select({
      studentName: users.name,
      studentEmail: users.email,
      courseName: courses.name,
      courseCode: courses.code,
      sessionDate: classSessions.startedAt,
      status: attendanceRecords.status,
      markedAt: attendanceRecords.markedAt,
    })
    .from(attendanceRecords)
    .innerJoin(users, eq(attendanceRecords.studentId, users.id))
    .innerJoin(classSessions, eq(attendanceRecords.sessionId, classSessions.id))
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .orderBy(classSessions.startedAt);

  if (format === 'json') {
    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': 'attachment; filename="reporte-asistencias.json"',
      },
    });
  }

  // CSV format
  const headers = ['Estudiante', 'Email', 'Curso', 'Código', 'Fecha Sesión', 'Estado', 'Hora Registro'];
  const rows = data.map((row) => [
    row.studentName,
    row.studentEmail,
    row.courseName,
    row.courseCode,
    new Date(row.sessionDate).toLocaleDateString('es-ES'),
    row.status,
    new Date(row.markedAt).toLocaleString('es-ES'),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="reporte-asistencias.csv"',
    },
  });
}
