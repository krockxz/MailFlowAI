import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppErrorBoundary } from './AppErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'MailFlowAI',
  description: 'AI-powered email client',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppErrorBoundary>
            {children}
          </AppErrorBoundary>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
