export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, enrollments } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const courseEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, params.id));

  return NextResponse.json({ enrollments: courseEnrollments });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { studentIds } = body as { studentIds: string[] };

  // Delete all current enrollments
  await db.delete(enrollments).where(eq(enrollments.courseId, params.id));

  // Insert new enrollments
  if (studentIds.length > 0) {
    await db.insert(enrollments).values(
      studentIds.map((studentId) => ({
        courseId: params.id,
        studentId,
        active: true,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
