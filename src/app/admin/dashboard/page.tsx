// src/app/admin/dashboard/page.tsx - SÉCURISÉ AVEC AUTHENTIFICATION
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BarChart3, ListOrdered, Users, Settings, Menu, Percent, Banknote, LogOut, Shield, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthClient } from '@/hooks/useAuthClient';
import { useToast } from '@/hooks/use-toast';
import AdminEventManagement from "@/components/admin/AdminEventManagement";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminStats from "@/components/admin/AdminStats";
import AdminCommissionManagement from '@/components/admin/AdminCommissionManagement';
import AdminPayoutManagement from '@/components/admin/AdminPayoutManagement';

const tabs = [
    { value: "stats", label: "Statistiques", icon: BarChart3 },
    { value: "events", label: "Événements", icon: ListOrdered },
    { value: "users", label: "Utilisateurs", icon: Users },
    { value: "commissions", label: "Commissions", icon: Percent },
    { value: "payouts", label: "Paiements", icon: Banknote },
    { value: "settings", label: "Paramètres", icon: Settings },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("stats");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const auth = useAuthClient();
  const router = useRouter();
  const { toast } = useToast();

  // ✅ VÉRIFICATION D'AUTHENTIFICATION ET DE RÔLE
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder au dashboard admin",
          variant: "destructive"
        });
        router.push('/auth/login');
      } else if (auth.profile?.role !== 'admin') {
        toast({
          title: "Accès refusé", 
          description: "Vous devez être administrateur pour accéder à cette page",
          variant: "destructive"
        });
        router.push('/'); // Rediriger vers l'accueil
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.profile?.role, router, toast]);

  // ✅ FONCTION DE DÉCONNEXION
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      router.push('/auth/login');
    } catch (error) {
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive"
      });
    }
  };

  // ✅ AFFICHAGE DE CHARGEMENT
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification des permissions administrateur...</p>
        </div>
      </div>
    );
  }

  // ✅ BLOCAGE SI PAS ADMIN
  if (!auth.isAuthenticated || auth.profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Accès refusé. Cette page est réservée aux administrateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Admin</h1>
              <p className="text-sm text-muted-foreground">
                Connecté en tant que : {auth.profile?.name || auth.user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-3/4">
                  <SheetTitle className="sr-only">Menu Admin</SheetTitle>
                  <nav className="flex flex-col space-y-2 pt-6">
                    {tabs.map(tab => (
                      <SheetClose asChild key={tab.value}>
                         <Button
                          variant={activeTab === tab.value ? "default" : "ghost"}
                          className="justify-start"
                          onClick={() => setActiveTab(tab.value)}
                        >
                          <tab.icon className="mr-2 h-5 w-5" />
                          {tab.label}
                        </Button>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* ✅ MENU UTILISATEUR ADMIN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={auth.profile?.avatar_url || undefined} 
                      alt={auth.profile?.name || auth.user?.email || "Admin"} 
                    />
                    <AvatarFallback className="bg-red-100 text-red-700">
                      <Shield className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Shield className="h-3 w-3 text-red-600" />
                      {auth.profile?.name || "Administrateur"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {auth.user?.email}
                    </p>
                  </div>
                </div>
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
          </div>
      </div>

      {/* ✅ BADGE DE SÉCURITÉ */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          <strong>Mode Administrateur activé.</strong> Vous avez accès à toutes les fonctionnalités de gestion.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop: Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <div className="mt-6">
            <TabsContent value="stats">
                <AdminStats />
            </TabsContent>
            
            <TabsContent value="events">
                <AdminEventManagement />
            </TabsContent>

            <TabsContent value="users">
                <AdminUserManagement />
            </TabsContent>

            <TabsContent value="commissions">
                <AdminCommissionManagement />
            </TabsContent>

             <TabsContent value="payouts">
                <AdminPayoutManagement />
            </TabsContent>

            <TabsContent value="settings">
                <AdminSettings />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}