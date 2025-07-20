
"use client";

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import BottomNavbar from '@/components/BottomNavbar'; // Import BottomNavbar
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata can't be exported from a client component, so we define it here if needed,
// but for now, we'll keep the component structure simple. For dynamic metadata,
// a generateMetadata function would be needed in a server component layout or page.

/*
export const metadata: Metadata = {
  title: 'StreamVerse - Your Universe of Events',
  description: 'Live streaming, replay, and VOD platform.',
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(geistSans.variable, geistMono.variable, 'antialiased')}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}

// We need a client component to use usePathname
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPrintableTicketPage = pathname.includes('/ticket/');

  if (isPrintableTicketPage) {
    // For the printable page, we just render the children without any layout
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 page-transition pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <Toaster />
      <BottomNavbar />
    </div>
  );
};
