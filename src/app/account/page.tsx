// src/app/account/page.tsx - Dashboard acheteur avec données réelles
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Shield, 
  Briefcase, 
  Settings, 
  AlertTriangle,
  Calendar,
  Ticket,
  ShoppingBag,
  TrendingUp,
  LogOut,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase';
import { OrderService } from '@/services/orders'; // ✅ Utiliser le vrai service
import type { Order } from '@/types'; // ✅ Utiliser le vrai type

const supabase = createClient();

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'promoter' | 'user';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]); // ✅ Utiliser le vrai type Order
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
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

      // ✅ 3. Charger les VRAIES commandes utilisateur
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

  // ✅ CORRECTION : Charger les vraies commandes depuis OrderService
  const loadUserOrders = async (userId: string) => {
    try {
      console.log('🔍 Chargement des commandes réelles pour:', userId);
      
      // Utiliser le vrai service de commandes
      const userOrders = await OrderService.getOrdersByUserId(userId);
      
      console.log(`✅ ${userOrders.length} commandes trouvées`);
      setOrders(userOrders);
      
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos commandes",
        variant: "destructive"
      });
      // En cas d'erreur, laisser un tableau vide plutôt que des données simulées
      setOrders([]);
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

  // ✅ Calculer les vraies statistiques depuis les commandes réelles
  const userStats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.ticket?.price || 0), 0),
    eventsAttended: new Set(orders.map(o => o.eventId)).size,
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête avec informations utilisateur */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bonjour, {userData.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={roleInfo.color}>
                <RoleIcon className="mr-1 h-3 w-3" />
                {roleInfo.label}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{userData.email}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>

      {/* Alerte pour les rôles avancés */}
      {(userData.role === 'admin' || userData.role === 'promoter') && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <RoleIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Vous avez accès aux fonctionnalités avancées en tant que <strong>{roleInfo.label}</strong>.
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
          {/* ✅ Statistiques avec données réelles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalOrders}</div>
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
                  {userStats.totalSpent.toLocaleString('fr-FR')}
                </div>
                <p className="text-xs text-muted-foreground">Total dépensé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Événements</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.eventsAttended}</div>
                <p className="text-xs text-muted-foreground">Événements différents</p>
              </CardContent>
            </Card>
          </div>

          {/* Commandes récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes Récentes</CardTitle>
              <CardDescription>Vos derniers achats de billets</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{order.event?.title || 'Événement'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.ticket?.name} • {new Date(order.purchaseDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.ticket?.price?.toLocaleString('fr-FR')} XOF</p>
                        <Badge variant="secondary" className="text-xs">
                          Confirmé
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Et {orders.length - 5} autres commandes...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore acheté de billets.
                  </p>
                  <Button asChild>
                    <a href="/">Découvrir les événements</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {/* ✅ Liste complète des commandes réelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Toutes mes Commandes ({orders.length})
              </CardTitle>
              <CardDescription>Historique complet de vos achats de billets</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Ticket className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{order.event?.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {order.ticket?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Commandé le {new Date(order.purchaseDate).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {order.ticket?.price?.toLocaleString('fr-FR')} XOF
                            </p>
                            <Badge variant="secondary">Confirmé</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Aucune commande trouvée</h3>
                  <p className="text-muted-foreground mb-6">
                    Commencez à explorer nos événements pour faire votre premier achat !
                  </p>
                  <Button asChild size="lg">
                    <a href="/">Explorer les événements</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres du Compte
              </CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" defaultValue={userData.name} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={userData.email} disabled />
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Informations du compte</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Rôle:</span> {roleInfo.label}</p>
                  <p><span className="text-muted-foreground">Membre depuis:</span> {new Date(userData.created_at).toLocaleDateString('fr-FR')}</p>
                  <p><span className="text-muted-foreground">Dernière modification:</span> {new Date(userData.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button>Sauvegarder les modifications</Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}