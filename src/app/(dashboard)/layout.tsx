import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar user={session.user} />
      <main className="flex-1 p-6 bg-muted/30 overflow-auto">
        {children}
      </main>
    </div>
  );
}
