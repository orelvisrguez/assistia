import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { db } from '@/lib/db';
import { classSessions, courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
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
        professorId: courses.professorId
      })
      .from(classSessions)
      .innerJoin(courses, eq(classSessions.courseId, courses.id))
      .where(eq(classSessions.id, params.id))
      .limit(1);

    if (!classSession[0] || classSession[0].professorId !== session.user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db
      .update(classSessions)
      .set({
        isActive: false,
        endedAt: new Date()
      })
      .where(eq(classSessions.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
