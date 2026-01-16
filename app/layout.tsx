import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { FooterVisibilityProvider } from '@/contexts/FooterVisibilityContext';
import NotificationToast from '@/components/NotificationToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PingWise - Medical Clinic Management System',
  description: 'Comprehensive medical clinic management system',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <ErrorBoundary>
          <ThemeProvider>
            <FontSizeProvider>
              <AuthProvider>
                <NotificationProvider>
                  <FooterVisibilityProvider>
                    {children}
                  <NotificationToast />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: 'var(--toast-bg, #fff)',
                        color: 'var(--toast-color, #333)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                      className: 'dark:!bg-gray-800 dark:!text-gray-100',
                      success: {
                        iconTheme: {
                          primary: '#1A3E9E',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                  </FooterVisibilityProvider>
                </NotificationProvider>
              </AuthProvider>
            </FontSizeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
