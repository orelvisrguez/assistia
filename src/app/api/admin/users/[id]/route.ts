export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface Params {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, role, password } = body;

  const updateData: any = {
    name,
    email,
    role,
    updatedAt: new Date(),
  };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  // Prevent self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json({ message: 'No puedes eliminarte a ti mismo' }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, params.id));

  return NextResponse.json({ success: true });
}
