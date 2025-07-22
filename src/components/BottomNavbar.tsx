// src/components/BottomNavbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Video, UserCircle, Briefcase, ShieldCheck, LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthClient } from '@/hooks/useAuthClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LucideIcon } from 'lucide-react';

// Types pour les éléments de navigation
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface RoleInfo {
  icon: LucideIcon;
  name: string;
  href: string;
  hasDropdown: boolean;
}

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const baseNavItems: NavItem[] = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Live', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const auth = useAuthClient();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Fonction pour obtenir l'icône et le titre selon le rôle
  const getRoleInfo = (): RoleInfo => {
    if (!auth.isAuthenticated) {
      return {
        icon: LogIn,
        name: 'Connexion',
        href: '/auth/login',
        hasDropdown: false
      };
    }

    switch (auth.profile?.role) {
      case 'admin':
        return {
          icon: ShieldCheck,
          name: 'Admin',
          href: '/admin/dashboard',
          hasDropdown: true
        };
      case 'promoter':
        return {
          icon: Briefcase,
          name: 'Promoteur',
          href: '/promoter/dashboard',
          hasDropdown: true
        };
      default:
        return {
          icon: UserCircle,
          name: 'Compte',
          href: '/account',
          hasDropdown: true
        };
    }
  };

  // Fonction pour obtenir les éléments du menu selon le rôle
  const getMenuItems = (): MenuItem[] => {
    if (!auth.isAuthenticated) return [];

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
  const menuItems = getMenuItems();
  const RoleIcon = roleInfo.icon;

  // Combiner les éléments de navigation
  const allNavItems = [...baseNavItems, roleInfo];

  // Composant pour l'avatar utilisateur
  const UserAvatar = () => {
    if (!auth.isAuthenticated) return null;
    
    return (
      <Avatar className="w-6 h-6">
        <AvatarImage 
          src={auth.profile?.avatar_url || undefined} 
          alt={auth.profile?.name || auth.user?.email || "User"} 
        />
        <AvatarFallback className="text-xs">
          {auth.profile?.name?.charAt(0) || auth.user?.email?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
    );
  };

  // Contenu du menu utilisateur
  const ProfileMenuContent = () => (
    <div className="space-y-4 py-6">
      {/* Informations utilisateur */}
      <div className="px-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={auth.profile?.avatar_url || undefined} 
              alt={auth.profile?.name || auth.user?.email || "User"} 
            />
            <AvatarFallback>
              {auth.profile?.name?.charAt(0) || auth.user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {auth.profile?.name || auth.user?.email}
            </h3>
            <p className="text-sm text-muted-foreground">
              {auth.user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {auth.profile?.role || 'Utilisateur'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Menu selon le rôle */}
      <div className="px-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className="w-full justify-start h-auto py-3"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            <Link href={item.href} className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <Separator />

      {/* Déconnexion */}
      <div className="px-4">
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            setIsProfileMenuOpen(false);
            auth.signOut();
          }}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );

  // Fonction pour gérer le clic sur l'icône de rôle
  const handleRoleIconClick = () => {
    if (!auth.isAuthenticated || !roleInfo.hasDropdown) {
      // Si pas connecté ou pas de dropdown, ne rien faire (le Link gérera la navigation)
      return;
    }
    
    // Si connecté avec dropdown, ouvrir le menu
    setIsProfileMenuOpen(true);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-md z-50 flex justify-between items-center">
        {allNavItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isRoleIcon = index === allNavItems.length - 1; // Dernière icône = icône de rôle
          const isAccountRelated = item.href === '/account' || item.href?.includes('/admin/') || item.href?.includes('/promoter/');
          
          // Pour l'icône de rôle avec dropdown
          if (isRoleIcon && auth.isAuthenticated && roleInfo.hasDropdown) {
            return (
              <button
                key={item.name}
                onClick={handleRoleIconClick}
                className={cn(
                  "flex flex-col items-center justify-center flex-shrink-0 w-20 h-full p-1 text-xs font-medium transition-colors duration-150",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Afficher l'avatar pour les comptes utilisateur connectés, sinon l'icône du rôle */}
                {isAccountRelated && auth.isAuthenticated ? (
                  <UserAvatar />
                ) : (
                  <RoleIcon size={22} className={cn(isActive ? "text-primary" : "")} />
                )}
                <span className="mt-0.5 text-center truncate w-full">
                  {item.name}
                </span>
              </button>
            );
          }
          
          // Pour les autres icônes (navigation normale)
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
              <span className="mt-0.5 text-center truncate w-full">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sheet pour le menu utilisateur */}
      <Sheet open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-lg">
          <SheetTitle className="sr-only">Menu utilisateur</SheetTitle>
          <ProfileMenuContent />
        </SheetContent>
      </Sheet>
    </>
  );
}