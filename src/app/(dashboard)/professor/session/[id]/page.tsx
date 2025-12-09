import { auth } from '@/lib/auth/config';
import { db, classSessions, courses } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { QRDisplay } from '@/components/qr/QRDisplay';
import { AttendanceList } from '@/components/dashboard/AttendanceList';
import { EndSessionButton } from '@/components/dashboard/EndSessionButton';

interface Props {
  params: { id: string };
}

export default async function SessionPage({ params }: Props) {
  const session = await auth();
  
  const [classSession] = await db
    .select({
      session: classSessions,
      course: courses,
    })
    .from(classSessions)
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .where(and(
      eq(classSessions.id, params.id),
      eq(classSessions.professorId, session!.user.id),
      eq(classSessions.isActive, true)
    ))
    .limit(1);

  if (!classSession) {
    redirect('/professor');
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <QRDisplay 
          sessionId={params.id} 
          courseName={classSession.course.name}
        />
        <div className="mt-6">
          <EndSessionButton sessionId={params.id} />
        </div>
      </div>
      
      <div className="lg:w-80">
        <AttendanceList sessionId={params.id} />
      </div>
    </div>
  );
}
