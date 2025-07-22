// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv2, Clapperboard, Video, UserCircle, Briefcase, Menu, ShieldCheck, Settings, LogOut, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthClient } from '@/hooks/useAuthClient';
import React from 'react';

const mainNavItems = [
  { name: 'Accueil', href: '/', icon: Tv2 },
  { name: 'Live Streams', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const auth = useAuthClient();

  // Fonction pour obtenir l'icône et le titre selon le rôle
  const getRoleInfo = () => {
    switch (auth.profile?.role) {
      case 'admin':
        return {
          icon: ShieldCheck,
          title: 'Administration',
          label: 'Menu Admin'
        };
      case 'promoter':
        return {
          icon: Briefcase,
          title: 'Espace Promoteur',
          label: 'Menu Promoteur'
        };
      default:
        return {
          icon: UserCircle,
          title: 'Mon Compte',
          label: 'Menu Utilisateur'
        };
    }
  };

  // Fonction pour obtenir les éléments du dropdown selon le rôle
  const getDropdownItems = () => {
    switch (auth.profile?.role) {
      case 'admin':
        return [
          { label: 'Tableau de Bord Admin', href: '/admin/dashboard', icon: ShieldCheck },
          { label: 'Paramètres du Profil', href: '/admin/profile-settings', icon: User },
        ];
      case 'promoter':
        return [
          { label: 'Tableau de Bord Promoteur', href: '/promoter/dashboard', icon: Briefcase },
          { label: 'Mon Compte', href: '/account', icon: UserCircle },
        ];
      default:
        return [
          { label: 'Mon Compte', href: '/account', icon: UserCircle },
        ];
    }
  };

  const roleInfo = getRoleInfo();
  const dropdownItems = getDropdownItems();
  const RoleIcon = roleInfo.icon;

  // Fonction pour le dropdown desktop
  const renderDesktopDropdown = () => {
    if (!auth.isAuthenticated) return null;

    const currentRoleInfo = getRoleInfo();
    const currentDropdownItems = getDropdownItems();
    const CurrentRoleIcon = currentRoleInfo.icon;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            title={`Menu ${currentRoleInfo.title}`}
            className="text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <CurrentRoleIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            {auth.user?.email}
          </div>
          <div className="px-2 py-1 text-xs text-muted-foreground">
            {currentRoleInfo.title}
          </div>
          <DropdownMenuSeparator />
          
          {currentDropdownItems.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => auth.signOut()}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Fonction pour les éléments mobile
  const renderMobileMenuItems = () => {
    if (!auth.isAuthenticated) return null;

    const currentRoleInfo = getRoleInfo();
    const currentDropdownItems = getDropdownItems();

    return (
      <div className="border-t pt-4 mt-4">
        <div className="px-2 py-2 text-sm font-medium text-muted-foreground">
          {auth.user?.email}
        </div>
        <div className="px-2 py-1 text-xs text-muted-foreground mb-2">
          {currentRoleInfo.title}
        </div>
        
        {currentDropdownItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
          onClick={() => {
            setIsMobileMenuOpen(false);
            auth.signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    );
  };

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
            
            {/* UNE SEULE icône selon le rôle OU bouton de connexion */}
            <div className="hidden md:flex items-center">
              {auth.isAuthenticated ? (
                renderDesktopDropdown()
              ) : (
                <Button asChild variant="default">
                  <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-3/4">
                  <SheetTitle className="sr-only">Menu Navigation</SheetTitle>
                  <nav className="flex flex-col space-y-2 pt-6">
                    {/* Navigation principale */}
                    {mainNavItems.map((item) => (
                      <Button
                        key={item.name}
                        asChild
                        variant={pathname === item.href ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href={item.href}>
                          <item.icon size={18} className="mr-2" />
                          {item.name}
                        </Link>
                      </Button>
                    ))}
                    
                    {/* Menu selon le rôle OU bouton de connexion */}
                    {auth.isAuthenticated ? (
                      renderMobileMenuItems()
                    ) : (
                      <div className="border-t pt-4 mt-4">
                        <Button
                          asChild
                          variant="default"
                          className="w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/auth/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Se connecter
                          </Link>
                        </Button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}