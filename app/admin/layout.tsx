import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import Sidebar from '@/components/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }

  if (session.role !== 'admin') {
    redirect('/dashboard'); // Redirect non-admin users
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}