import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { classSessions, courses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptQRPayload } from '@/lib/qr/crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classSession = await db
      .select({
        id: classSessions.id,
        qrSecret: classSessions.qrSecret,
        isActive: classSessions.isActive,
        professorId: courses.professorId
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(eq(classSessions.id, params.id))
      .limit(1);

    if (!classSession[0] || classSession[0].professorId !== session.user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!classSession[0].isActive) {
      return NextResponse.json({ error: 'Session ended' }, { status: 400 });
    }

    const qrData = encryptQRPayload(params.id, classSession[0].qrSecret);

    return NextResponse.json({ qrData });
  } catch (error) {
    console.error('QR error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
