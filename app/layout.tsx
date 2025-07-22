import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CASA - Swipe Your Style',
  description: 'Mobile-first Gen-Z fashion platform with AI-powered recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white overflow-x-hidden`}>
        <div className="max-w-sm mx-auto min-h-screen bg-black">
          {children}
        </div>
      </body>
    </html>
  );
}