import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, classSessions, courses } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateSessionSecret } from '@/lib/qr/crypto';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'professor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, latitude, longitude } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'Course ID requerido' }, { status: 400 });
  }

  // Verify professor owns this course
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course || course.professorId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado para este curso' }, { status: 403 });
  }

  // Create session
  const [newSession] = await db
    .insert(classSessions)
    .values({
      courseId,
      professorId: session.user.id,
      qrSecret: generateSessionSecret(),
      latitude,
      longitude,
      isActive: true,
    })
    .returning();

  return NextResponse.json({ session: newSession });
}
