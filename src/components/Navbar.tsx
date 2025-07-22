// src/components/Navbar.tsx - AVEC AUTHENTIFICATION UTILISATEUR
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Tv2, Clapperboard, Video, Search, Menu, LogOut, User, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthClient } from '@/hooks/useAuthClient';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const mainNavItems = [
  { name: 'Accueil', href: '/', icon: Tv2 },
  { name: 'Live Streams', href: '/live', icon: Clapperboard },
  { name: 'VODs', href: '/vod', icon: Video },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const auth = useAuthClient();
  const { toast } = useToast();

  // Fonction de déconnexion
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive"
      });
    }
  };

  // Items de navigation conditionnels basés sur le rôle
  const getConditionalNavItems = () => {
    const items = [];
    
    if (auth.isAuthenticated) {
      // Toujours afficher "Mon Compte"
      items.push({ name: 'Mon Compte', href: '/account', icon: User });
      
      // Afficher "Promoteur" si l'utilisateur est promoteur ou admin
      if (auth.profile?.role === 'promoter' || auth.profile?.role === 'admin') {
        items.push({ name: 'Espace Promoteur', href: '/promoter/dashboard', icon: Briefcase });
      }
      
      // Afficher "Admin" seulement si l'utilisateur est admin
      if (auth.profile?.role === 'admin') {
        items.push({ name: 'Administration', href: '/admin/dashboard', icon: ShieldCheck });
      }
    }
    
    return items;
  };

  const conditionalNavItems = getConditionalNavItems();

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Tv2 size={28} />
            <span>StreamVerse</span>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Navigation principale - Desktop */}
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
            
            {/* Navigation conditionnelle - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {conditionalNavItems.map((item) => (
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

            {/* Zone utilisateur/authentification - Desktop */}
            <div className="hidden md:flex items-center">
              {auth.isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={auth.profile?.avatar_url || undefined} 
                          alt={auth.profile?.name || auth.user?.email || "User"} 
                        />
                        <AvatarFallback>
                          {auth.profile?.name?.charAt(0) || auth.user?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">
                          {auth.profile?.name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {auth.user?.email}
                        </p>
                        {auth.profile?.role && (
                          <p className="text-xs text-primary font-medium capitalize">
                            {auth.profile.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default">
                  <Link href="/auth/login">
                    Se connecter
                  </Link>
                </Button>
              )}
            </div>

            {/* Menu mobile */}
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
                    <Link 
                      href="/" 
                      className="flex items-center gap-2 text-lg font-bold text-primary mb-4" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Tv2 size={24} />
                      <span>StreamVerse</span>
                    </Link>

                    {/* Navigation principale mobile */}
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 hover:bg-accent hover:text-accent-foreground transition-colors",
                          pathname === item.href
                           ? "bg-primary text-primary-foreground" 
                           : "text-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon size={20} />
                        {item.name}
                      </Link>
                    ))}

                    {/* Séparateur si utilisateur connecté */}
                    {auth.isAuthenticated && (
                      <div className="border-t border-border my-2"></div>
                    )}

                    {/* Navigation conditionnelle mobile */}
                    {conditionalNavItems.map((item) => (
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

                    {/* Zone utilisateur mobile */}
                    <div className="border-t border-border mt-4 pt-4">
                      {auth.isAuthenticated ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={auth.profile?.avatar_url || undefined} 
                                alt={auth.profile?.name || auth.user?.email || "User"} 
                              />
                              <AvatarFallback className="text-xs">
                                {auth.profile?.name?.charAt(0) || auth.user?.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {auth.profile?.name || "Utilisateur"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {auth.user?.email}
                              </p>
                              {auth.profile?.role && (
                                <p className="text-xs text-primary font-medium capitalize">
                                  {auth.profile.role}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              handleSignOut();
                              setIsMobileMenuOpen(false);
                            }}
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Se déconnecter
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          asChild 
                          className="w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/auth/login">
                            Se connecter
                          </Link>
                        </Button>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
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