import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/src/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CareerX Workspace',
  description: 'Enterprise recruitment management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black font-sans">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
