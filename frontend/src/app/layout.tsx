import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/ui/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'VedaAI | AI Assessment Creator',
  description: 'Generate professional question papers using AI',

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],

    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },

    shortcut: '/favicon.ico',
  },

  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
