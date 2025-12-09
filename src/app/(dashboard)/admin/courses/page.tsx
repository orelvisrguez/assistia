import { db, courses, users, enrollments } from '@/lib/db';
import { eq, count, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateCourseDialog } from '@/components/admin/CreateCourseDialog';
import { CourseActions } from '@/components/admin/CourseActions';
import { ManageEnrollments } from '@/components/admin/ManageEnrollments';

export default async function CoursesPage() {
  const allCourses = await db
    .select({
      course: courses,
      professor: users,
      enrollmentCount: count(enrollments.id),
    })
    .from(courses)
    .leftJoin(users, eq(courses.professorId, users.id))
    .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
    .groupBy(courses.id, users.id)
    .orderBy(desc(courses.createdAt));

  const professors = await db
    .select()
    .from(users)
    .where(eq(users.role, 'professor'));

  const students = await db
    .select()
    .from(users)
    .where(eq(users.role, 'student'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cursos</h1>
          <p className="text-muted-foreground">
            Administra cursos, asigna profesores y estudiantes
          </p>
        </div>
        <CreateCourseDialog professors={professors} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allCourses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Inscripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {allCourses.reduce((acc, c) => acc + Number(c.enrollmentCount), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allCourses.map(({ course, professor, enrollmentCount }) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">{course.code}</Badge>
                </div>
                <CourseActions course={course} professors={professors} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Profesor: </span>
                <span className="font-medium">{professor?.name || 'Sin asignar'}</span>
              </div>
              {course.location && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Ubicación: </span>
                  <span>{course.location}</span>
                </div>
              )}
              {course.schedule && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Horario: </span>
                  <span>{course.schedule}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="success">{enrollmentCount} estudiantes</Badge>
              </div>
              <div className="pt-2">
                <ManageEnrollments course={course} students={students} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allCourses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay cursos creados aún</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
