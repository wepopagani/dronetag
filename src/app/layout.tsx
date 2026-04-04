import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'DroneTag — Operator Verification Platform',
  description: 'Credential verification and insurance document management for drone operators and organizations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <LanguageProvider>
            <Navbar />
            <main className="min-h-screen pt-14">{children}</main>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
