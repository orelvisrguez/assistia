import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { courses, classSessions, enrollments } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { encryptQRPayload } from '@/lib/qr/crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, location, useGeolocation } = body;

    // Verify course belongs to professor
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course[0] || course[0].professorId !== session.user.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Generate QR secret
    const qrSecret = crypto.randomBytes(32).toString('hex');

    // Create session
    const [newSession] = await db
      .insert(classSessions)
      .values({
        courseId,
        professorId: session.user.id,
        qrSecret,
        startedAt: new Date(),
        isActive: true,
        latitude: location?.lat || null,
        longitude: location?.lng || null
      })
      .returning();

    // Get enrolled students count
    const enrolled = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    // Generate initial QR
    const qrData = encryptQRPayload(newSession.id, qrSecret);

    return NextResponse.json({
      sessionId: newSession.id,
      qrData,
      totalStudents: enrolled[0]?.count || 0
    });
  } catch (error) {
    console.error('Start session error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
