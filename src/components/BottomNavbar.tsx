// src/components/BottomNavbar.tsx - AVEC AUTHENTIFICATION
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Video, User, Briefcase, ShieldCheck, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthClient } from '@/hooks/useAuthClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const baseNavItems = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Live', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const auth = useAuthClient();

  // Construire les items de navigation en fonction de l'authentification
  const getNavItems = () => {
    const items = [...baseNavItems];
    
    if (auth.isAuthenticated) {
      // Ajouter les options selon le rôle
      if (auth.profile?.role === 'admin') {
        items.push({ name: 'Admin', href: '/admin/dashboard', icon: ShieldCheck });
      }
      
      if (auth.profile?.role === 'promoter' || auth.profile?.role === 'admin') {
        items.push({ name: 'Promoteur', href: '/promoter/dashboard', icon: Briefcase });
      }
      
      items.push({ name: 'Compte', href: '/account', icon: User });
    } else {
      // Si pas connecté, afficher le bouton de connexion
      items.push({ name: 'Connexion', href: '/auth/login', icon: LogIn });
    }
    
    return items;
  };

  const navItems = getNavItems();

  // Composant personnalisé pour l'avatar utilisateur
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-md z-50 flex justify-between items-center overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const isAccountPage = item.href === '/account';
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-shrink-0 w-20 h-full p-1 text-xs font-medium transition-colors duration-150",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Afficher l'avatar pour la page compte si connecté, sinon l'icône */}
            {isAccountPage && auth.isAuthenticated ? (
              <UserAvatar />
            ) : (
              <item.icon size={22} className={cn(isActive ? "text-primary" : "")} />
            )}
            
            <span className="mt-0.5 text-center truncate w-full">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}