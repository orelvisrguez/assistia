import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth/config';
import { db, classSessions, attendanceRecords, enrollments } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyQRPayload, calculateDistance } from '@/lib/qr/crypto';

const MAX_DISTANCE_METERS = parseInt(process.env.GEOLOCATION_RADIUS_METERS || '100');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { qrPayload, latitude, longitude, deviceInfo } = body;

    if (!qrPayload) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 });
    }

    // Get active sessions to verify QR
    const allSessions = await db
      .select()
      .from(classSessions)
      .where(eq(classSessions.isActive, true));

    if (allSessions.length === 0) {
      return NextResponse.json({ error: 'No hay sesiones activas' }, { status: 400 });
    }

    let validSession = null;
    let lastError = 'No matching session';
    
    for (const cs of allSessions) {
      if (!cs.qrSecret) continue;
      const result = verifyQRPayload(qrPayload, cs.qrSecret);
      if (result.valid && result.sessionId === cs.id) {
        validSession = cs;
        break;
      }
      if (result.reason) lastError = result.reason;
    }

    if (!validSession) {
      return NextResponse.json({ error: `QR inválido: ${lastError}` }, { status: 400 });
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
      return NextResponse.json({ error: 'No estás inscrito en este curso' }, { status: 403 });
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
      return NextResponse.json({ error: 'Ya registraste tu asistencia' }, { status: 400 });
    }

    // Optional: verify geolocation
    if (validSession.latitude && validSession.longitude && latitude && longitude) {
      const distance = calculateDistance(
        validSession.latitude, validSession.longitude,
        latitude, longitude
      );
      
      if (distance > MAX_DISTANCE_METERS) {
        return NextResponse.json({ 
          error: `Estás muy lejos del aula (${Math.round(distance)}m)` 
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
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
