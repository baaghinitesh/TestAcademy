import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import Sidebar from '@/components/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  
  try {
    session = await getSession();
  } catch (error) {
    console.error('Error getting session:', error);
    redirect('/sign-in');
  }
  
  if (!session) {
    redirect('/sign-in');
  }

  if (session.role !== 'admin') {
    redirect('/dashboard'); // Redirect non-admin users
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background">
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}