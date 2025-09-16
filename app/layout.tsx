import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import Navbar from '@/components/navbar';
import { getUser } from '@/lib/db/queries-mongo';
import { headers } from 'next/headers';
import { ErrorBoundary } from '@/components/error-boundary';
import { PerformanceMonitor } from '@/components/debug/performance-monitor';

export const metadata: Metadata = {
  title: 'EduTest - Study & Test Platform',
  description: 'Online learning platform for Classes 5-10 with study materials, tests, and performance analytics'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Get user data for navbar
  const user = await getUser();
  
  // Hide navbar on test panel pages for fullscreen experience
  const hideNavbar = pathname.startsWith('/test/') && pathname.includes('/panel');

  return (
    <html
      lang="en"
      className={`${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-background text-foreground">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ErrorBoundary>
                <div className="flex flex-col min-h-screen">
                  {!hideNavbar && (
                    <ErrorBoundary>
                      <Navbar user={user} />
                    </ErrorBoundary>
                  )}
                  <main className="flex-1">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                </div>
              </ErrorBoundary>
            </AuthProvider>
          </ThemeProvider>
          <PerformanceMonitor />
        </ErrorBoundary>
      </body>
    </html>
  );
}
