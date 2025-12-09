import { db, users, courses, enrollments, attendanceRecords } from '@/lib/db';
import { count, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [courseCount] = await db.select({ count: count() }).from(courses);
  const [enrollmentCount] = await db.select({ count: count() }).from(enrollments);
  const [attendanceCount] = await db.select({ count: count() }).from(attendanceRecords);

  const stats = [
    { label: 'Usuarios', value: userCount.count, href: '/admin/users', color: 'text-blue-600' },
    { label: 'Cursos', value: courseCount.count, href: '/admin/courses', color: 'text-green-600' },
    { label: 'Inscripciones', value: enrollmentCount.count, href: '/admin/courses', color: 'text-purple-600' },
    { label: 'Asistencias', value: attendanceCount.count, href: '/admin/reports', color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Gestiona usuarios, cursos y reportes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">Gestionar Usuarios</p>
              <p className="text-sm text-muted-foreground">Crear, editar o eliminar usuarios</p>
            </Link>
            <Link href="/admin/courses" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">Gestionar Cursos</p>
              <p className="text-sm text-muted-foreground">Administrar cursos e inscripciones</p>
            </Link>
            <Link href="/admin/reports" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">Ver Reportes</p>
              <p className="text-sm text-muted-foreground">Estadísticas y exportación</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
