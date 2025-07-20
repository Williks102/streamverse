
// src/components/BottomNavbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Video, UserCircle, Briefcase, ShieldCheck } from 'lucide-react'; // Added Briefcase, ShieldCheck
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Live', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
  { name: 'Admin', href: '/admin/dashboard', icon: ShieldCheck },
  { name: 'Promoteur', href: '/promoter/dashboard', icon: Briefcase },
  { name: 'Compte', href: '/account', icon: UserCircle },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  // Filter out admin/promoter for non-logged in users in a real app
  // For now, we show them all but make it scrollable
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-md z-50 flex justify-between items-center overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-shrink-0 w-20 h-full p-1 text-xs font-medium transition-colors duration-150",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon size={22} className={cn(isActive ? "text-primary" : "")} />
            <span className="mt-0.5 text-center">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
