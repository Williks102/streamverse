// src/app/account/page.tsx - AVEC VRAIES DONNÉES UTILISATEUR
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { User, Settings, ShoppingBag, LogOut, AlertTriangle, Shield, Briefcase } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AccountSettings from '@/components/AccountSettings';
import type { Database } from '@/types/database';

// Client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'promoter' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  event_title: string;
  ticket_name: string;
  price: number;
  created_at: string;
  status: string;
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Vérifier la session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('❌ Pas de session:', sessionError);
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page",
          variant: "destructive"
        });
        router.push('/auth/login');
        return;
      }

      console.log('✅ Session trouvée pour:', session.user.email);

      // 2. Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive"
        });
        return;
      }

      const user: UserData = {
        id: profile.id,
        email: session.user.email || '',
        name: profile.name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };

      setUserData(user);
      console.log('👤 Profil chargé:', user);

      // 3. Charger les commandes utilisateur (si c'est un user)
      if (profile.role === 'user') {
        await loadUserOrders(session.user.id);
      }

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserOrders = async (userId: string) => {
    try {
      // Note: Vous devrez adapter cette requête selon votre structure de base de données
      // Pour l'instant, je simule des commandes
      const mockOrders: Order[] = [
        {
          id: '1',
          event_title: 'Conférence Tech 2024',
          ticket_name: 'Billet Standard',
          price: 15000,
          created_at: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          event_title: 'Workshop Design',
          ticket_name: 'Accès Premium',
          price: 25000,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrateur',
          icon: Shield,
          color: 'bg-red-100 text-red-800',
          description: 'Accès complet à toutes les fonctionnalités'
        };
      case 'promoter':
        return {
          label: 'Promoteur',
          icon: Briefcase,
          color: 'bg-blue-100 text-blue-800',
          description: 'Peut créer et gérer des événements'
        };
      case 'user':
      default:
        return {
          label: 'Utilisateur',
          icon: User,
          color: 'bg-green-100 text-green-800',
          description: 'Peut acheter des billets et participer aux événements'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger vos informations. Veuillez vous reconnecter.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const roleInfo = getRoleInfo(userData.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-8">
      {/* En-tête du profil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={userData.avatar_url || undefined} 
                  alt={userData.name || userData.email} 
                />
                <AvatarFallback className="text-lg">
                  {userData.name?.charAt(0) || userData.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {userData.name || userData.email}
                </h1>
                <p className="text-muted-foreground">{userData.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={roleInfo.color}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Membre depuis {new Date(userData.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {roleInfo.description}
          </p>
        </CardContent>
      </Card>

      {/* Navigation rapide pour les autres rôles */}
      {(userData.role === 'admin' || userData.role === 'promoter') && (
        <Alert className="border-blue-200 bg-blue-50">
          <RoleIcon className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                Vous avez accès à des fonctionnalités avancées.
              </span>
              <div className="flex gap-2">
                {userData.role === 'admin' && (
                  <Button size="sm" asChild>
                    <a href="/admin/dashboard">Dashboard Admin</a>
                  </Button>
                )}
                {(userData.role === 'promoter' || userData.role === 'admin') && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/promoter/dashboard">Dashboard Promoteur</a>
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principal */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">Total des achats</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
                <span className="text-sm">XOF</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.reduce((sum, order) => sum + order.price, 0).toLocaleString('fr-FR')}
                </div>
                <p className="text-xs text-muted-foreground">Total dépensé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statut</CardTitle>
                <RoleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleInfo.label}</div>
                <p className="text-xs text-muted-foreground">Type de compte</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Historique des commandes</CardTitle>
              <CardDescription>Vos achats de billets d'événements</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{order.event_title}</h4>
                        <p className="text-sm text-muted-foreground">{order.ticket_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.price.toLocaleString('fr-FR')} XOF</p>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status === 'completed' ? 'Complété' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune commande trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AccountSettings userData={userData} onUserDataUpdate={setUserData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}