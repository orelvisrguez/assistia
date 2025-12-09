import { db, courses, users, attendanceRecords, classSessions, enrollments } from '@/lib/db';
import { eq, count, desc, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceChart } from '@/components/admin/AttendanceChart';
import { CourseStatsChart } from '@/components/admin/CourseStatsChart';
import { ExportButton } from '@/components/admin/ExportButton';

export default async function ReportsPage() {
  // Get all courses with attendance stats
  const courseStats = await db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      professorName: users.name,
      totalSessions: count(classSessions.id),
    })
    .from(courses)
    .leftJoin(users, eq(courses.professorId, users.id))
    .leftJoin(classSessions, eq(courses.id, classSessions.courseId))
    .groupBy(courses.id, users.name)
    .orderBy(desc(count(classSessions.id)));

  // Get attendance by course
  const attendanceByCode = await db
    .select({
      courseCode: courses.code,
      courseName: courses.name,
      attendanceCount: count(attendanceRecords.id),
    })
    .from(courses)
    .leftJoin(classSessions, eq(courses.id, classSessions.courseId))
    .leftJoin(attendanceRecords, eq(classSessions.id, attendanceRecords.sessionId))
    .groupBy(courses.id);

  // Get recent sessions
  const recentSessions = await db
    .select({
      id: classSessions.id,
      courseName: courses.name,
      professorName: users.name,
      startedAt: classSessions.startedAt,
      isActive: classSessions.isActive,
      attendanceCount: count(attendanceRecords.id),
    })
    .from(classSessions)
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .innerJoin(users, eq(classSessions.professorId, users.id))
    .leftJoin(attendanceRecords, eq(classSessions.id, attendanceRecords.sessionId))
    .groupBy(classSessions.id, courses.name, users.name)
    .orderBy(desc(classSessions.startedAt))
    .limit(10);

  // Total stats
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalCourses] = await db.select({ count: count() }).from(courses);
  const [totalSessions] = await db.select({ count: count() }).from(classSessions);
  const [totalAttendance] = await db.select({ count: count() }).from(attendanceRecords);

  // Prepare chart data
  const chartData = attendanceByCode.map((item) => ({
    name: item.courseCode,
    asistencias: Number(item.attendanceCount) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis completo de asistencia académica
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalCourses.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sesiones Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{totalSessions.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asistencias Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalAttendance.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asistencias por Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen por Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseStatsChart data={courseStats} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Curso</th>
                  <th className="pb-3 font-medium">Profesor</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Asistencias</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/50">
                    <td className="py-3 font-medium">{session.courseName}</td>
                    <td className="py-3 text-muted-foreground">{session.professorName}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString('es-ES', {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {session.isActive ? 'Activa' : 'Finalizada'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{session.attendanceCount}</td>
                  </tr>
                ))}
                {recentSessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay sesiones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
