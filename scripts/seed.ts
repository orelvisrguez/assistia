import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import * as schema from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const [admin] = await db.insert(schema.users).values({
    email: 'admin@demo.com',
    name: 'Administrador',
    passwordHash: adminPassword,
    role: 'admin',
  }).returning();
  console.log('✅ Admin created:', admin.email);

  // Create professor
  const profPassword = await bcrypt.hash('prof123', 10);
  const [professor] = await db.insert(schema.users).values({
    email: 'profesor@demo.com',
    name: 'Dr. Juan García',
    passwordHash: profPassword,
    role: 'professor',
  }).returning();
  console.log('✅ Professor created:', professor.email);

  // Create students
  const studentPassword = await bcrypt.hash('student123', 10);
  const students = await db.insert(schema.users).values([
    { email: 'estudiante1@demo.com', name: 'María López', passwordHash: studentPassword, role: 'student' as const },
    { email: 'estudiante2@demo.com', name: 'Carlos Ruiz', passwordHash: studentPassword, role: 'student' as const },
    { email: 'estudiante3@demo.com', name: 'Ana Martínez', passwordHash: studentPassword, role: 'student' as const },
  ]).returning();
  console.log('✅ Students created:', students.length);

  // Create courses
  const [course] = await db.insert(schema.courses).values({
    name: 'Programación Web',
    code: 'INF-301',
    description: 'Desarrollo de aplicaciones web modernas',
    professorId: professor.id,
    location: 'Aula 201',
    schedule: 'Lun/Mié 10:00-12:00',
  }).returning();
  console.log('✅ Course created:', course.name);

  // Enroll students
  await db.insert(schema.enrollments).values(
    students.map(s => ({ studentId: s.id, courseId: course.id }))
  );
  console.log('✅ Students enrolled');

  console.log('\n📋 Demo Credentials:');
  console.log('Admin: admin@demo.com / admin123');
  console.log('Professor: profesor@demo.com / prof123');
  console.log('Student: estudiante1@demo.com / student123');
}

seed().catch(console.error);
