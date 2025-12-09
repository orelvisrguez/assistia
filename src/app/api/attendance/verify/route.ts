import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions, attendanceRecords, enrollments } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyQRPayload, calculateDistance } from '@/lib/qr/crypto';

const MAX_DISTANCE_METERS = parseInt(process.env.GEOLOCATION_RADIUS_METERS || '100');

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'student') {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { qrPayload, latitude, longitude, deviceInfo } = body;

  if (!qrPayload) {
    return NextResponse.json({ success: false, message: 'Código QR requerido' }, { status: 400 });
  }

  // Get session to verify QR
  const allSessions = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.isActive, true));

  let validSession = null;
  
  for (const cs of allSessions) {
    const result = verifyQRPayload(qrPayload, cs.qrSecret);
    if (result.valid && result.sessionId === cs.id) {
      validSession = cs;
      break;
    }
  }

  if (!validSession) {
    return NextResponse.json({ success: false, message: 'Código QR inválido o expirado' }, { status: 400 });
  }

  // Check enrollment
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(
      eq(enrollments.studentId, session.user.id),
      eq(enrollments.courseId, validSession.courseId),
      eq(enrollments.active, true)
    ))
    .limit(1);

  if (!enrollment) {
    return NextResponse.json({ success: false, message: 'No estás inscrito en este curso' }, { status: 403 });
  }

  // Check if already marked
  const [existingRecord] = await db
    .select()
    .from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.sessionId, validSession.id),
      eq(attendanceRecords.studentId, session.user.id)
    ))
    .limit(1);

  if (existingRecord) {
    return NextResponse.json({ success: false, message: 'Ya registraste tu asistencia' }, { status: 400 });
  }

  // Optional: verify geolocation
  if (validSession.latitude && validSession.longitude && latitude && longitude) {
    const distance = calculateDistance(
      validSession.latitude, validSession.longitude,
      latitude, longitude
    );
    
    if (distance > MAX_DISTANCE_METERS) {
      return NextResponse.json({ 
        success: false, 
        message: `Estás muy lejos del aula (${Math.round(distance)}m)` 
      }, { status: 400 });
    }
  }

  // Record attendance
  await db.insert(attendanceRecords).values({
    sessionId: validSession.id,
    studentId: session.user.id,
    status: 'present',
    latitude,
    longitude,
    deviceInfo,
  });

  return NextResponse.json({ success: true, message: '¡Asistencia registrada!' });
}
