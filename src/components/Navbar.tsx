
// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv2, Clapperboard, Video, UserCircle, Search, Briefcase, Menu, ShieldCheck } from 'lucide-react'; // Added Briefcase & ShieldCheck
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';

const mainNavItems = [
  { name: 'Accueil', href: '/', icon: Tv2 },
  { name: 'Live Streams', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
];

const secondaryNavItems = [
  { name: 'Admin', href: '/admin/dashboard', icon: ShieldCheck },
  { name: 'Outils Promoteur', href: '/promoter/dashboard', icon: Briefcase },
  { name: 'Mon Compte', href: '/account', icon: UserCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Tv2 size={28} />
            <span>StreamVerse</span>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {mainNavItems.map((item) => (
                <Button
                  key={item.name}
                  asChild
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn(
                    "text-sm font-medium",
                    pathname === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon size={18} className="mr-2" />
                    {item.name}
                  </Link>
                </Button>
              ))}
            </nav>
            
            <div className="hidden md:flex items-center space-x-1">
              {secondaryNavItems.map((item) => (
                 <Button
                  key={item.name}
                  asChild
                  variant="ghost"
                  size="icon"
                  title={item.name}
                  className={cn(
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                     pathname.startsWith(item.href) && item.href !== '/' ? "bg-accent text-accent-foreground" : ""
                  )}
                >
                  <Link href={item.href}>
                    <item.icon size={20} />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                </Button>
              ))}
            </div>


            {/* Mobile Menu Button (Hamburger) */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu size={24} />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-3/4 p-4 bg-card">
                  <SheetTitle className="sr-only">Menu principal</SheetTitle>
                  <nav className="flex flex-col space-y-2">
                     <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                        <Tv2 size={24} />
                        <span>StreamVerse</span>
                      </Link>
                    {[...mainNavItems, ...secondaryNavItems].map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 hover:bg-accent hover:text-accent-foreground transition-colors",
                          (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))
                           ? "bg-primary text-primary-foreground" 
                           : "text-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon size={20} />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="py-3 border-t border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des événements, catégories, ou intervenants..."
              className="w-full rounded-md bg-background pl-10 pr-4 py-2 text-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
