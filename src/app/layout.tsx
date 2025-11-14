import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { config } from '@/lib/config'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: config.APP_NAME,
  description: 'Sistem absensi digital dengan validasi lokasi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
          {children}
        </div>
      </body>
    </html>
  );
}