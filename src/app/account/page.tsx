// src/app/account/page.tsx - CORRECTIONS TYPESCRIPT FINALES
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Package, Settings, LogOut, Calendar, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Order, OrderStatus } from '@/types'; // ✅ Import du type OrderStatus
import { getUserOrders, getUserProfile } from './actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // ✅ CORRECTION : Fonction helper pour vérifier le statut de commande
  const isConfirmedOrder = (status: string): boolean => {
    // Utilisation d'une comparaison stricte avec le bon type
    return status === 'completed' || status === 'confirmed';
  };

  // ✅ FONCTION CORRIGÉE - Chargement des données utilisateur réelles
  const loadUserData = async () => {
    try {
      console.log('🔄 [ACCOUNT PAGE] Chargement des données utilisateur...');
      
      // 1. Vérifier la session côté client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('❌ [ACCOUNT PAGE] Pas de session:', sessionError);
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page",
          variant: "destructive"
        });
        router.push('/auth/login?returnUrl=/account');
        return;
      }

      console.log('✅ [ACCOUNT PAGE] Session trouvée pour:', session.user.email);

      // 2. Récupérer le profil utilisateur via l'action server
      const profileResult = await getUserProfile();
      
      if (!profileResult.success || !profileResult.data) {
        console.error('❌ [ACCOUNT PAGE] Erreur profil:', profileResult.message);
        toast({
          title: "Erreur",
          description: profileResult.message || "Impossible de charger votre profil",
          variant: "destructive"
        });
        
        // Si le profil n'existe pas, rediriger vers une page de création ou d'erreur
        if (profileResult.message?.includes('introuvable')) {
          router.push('/auth/login');
          return;
        }
      } else {
        // Construire les données utilisateur à partir du profil
        const user: UserData = {
          id: profileResult.data.id,
          email: profileResult.data.email,
          name: profileResult.data.name,
          role: profileResult.data.role,
          created_at: profileResult.data.created_at,
          updated_at: profileResult.data.updated_at,
        };

        setUserData(user);
        console.log('👤 [ACCOUNT PAGE] Profil chargé:', user);
      }

      // 3. Charger les commandes utilisateur pour les utilisateurs normaux
      if (profileResult.data?.role === 'user') {
        await loadUserOrdersReal();
      }

    } catch (error) {
      console.error('❌ [ACCOUNT PAGE] Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
      
      // En cas d'erreur grave, rediriger vers login
      router.push('/auth/login');
      
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FONCTION CORRIGÉE - Chargement des vraies commandes utilisateur
  const loadUserOrdersReal = async () => {
    try {
      setOrdersLoading(true);
      console.log('🔍 [ACCOUNT PAGE] Chargement des commandes réelles...');
      
      // Utiliser la nouvelle action sans mock ID  
      const userOrders = await getUserOrders();
      
      console.log(`✅ [ACCOUNT PAGE] ${userOrders.length} commandes trouvées`);
      setOrders(userOrders);
      
    } catch (error) {
      console.error('❌ [ACCOUNT PAGE] Erreur chargement commandes:', error);
      
      // Afficher un message d'erreur mais ne pas bloquer la page
      toast({
        title: "Erreur",
        description: "Impossible de charger vos commandes. Vous pouvez réessayer plus tard.",
        variant: "destructive"
      });
      
      // Définir un tableau vide pour éviter les erreurs d'affichage
      setOrders([]);
      
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fonction de déconnexion
  const handleSignOut = async () => {
    try {
      console.log('🔓 [ACCOUNT PAGE] Déconnexion...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [ACCOUNT PAGE] Erreur déconnexion:', error);
        toast({
          title: "Erreur de déconnexion",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ [ACCOUNT PAGE] Déconnexion réussie');
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      
      router.push('/');
      
    } catch (error) {
      console.error('❌ [ACCOUNT PAGE] Exception déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadUserData();
  }, []);

  // Affichage du loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de votre compte...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur si pas de données utilisateur
  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-4">
              Impossible de charger les informations de votre compte.
            </p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête du compte */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bonjour, {userData.name}</h1>
            <p className="text-muted-foreground">{userData.email}</p>
            <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
              {userData.role === 'admin' ? 'Administrateur' : 
               userData.role === 'promoter' ? 'Promoteur' : 'Utilisateur'}
            </Badge>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Informations du compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom</label>
              <p className="font-medium">{userData.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rôle</label>
              <p className="font-medium capitalize">{userData.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Membre depuis</label>
              <p className="text-sm">{new Date(userData.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <Button className="w-full" onClick={() => router.push('/account/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Modifier le profil
            </Button>
          </CardContent>
        </Card>

        {/* Commandes récentes - Seulement pour les utilisateurs normaux */}
        {userData.role === 'user' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Mes commandes
                {ordersLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Historique de vos achats de billets et accès
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chargement des commandes...</p>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore acheté de billets.
                  </p>
                  <Button onClick={() => router.push('/events')}>
                    Découvrir les événements
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{order.event?.title || 'Événement inconnu'}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {order.event?.date ? new Date(order.event.date).toLocaleDateString('fr-FR') : 
                             order.event?.startTime ? new Date(order.event.startTime).toLocaleDateString('fr-FR') : 
                             'Date inconnue'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {order.event?.location || 'En ligne'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{order.ticket?.price || 0}€</p>
                        <Badge 
                          variant={isConfirmedOrder(order.status) ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {/* ✅ CORRECTION : Utilisation de la fonction helper au lieu de comparaisons directes */}
                          {isConfirmedOrder(order.status) ? 'Confirmé' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {orders.length > 3 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/account/orders')}
                      >
                        Voir toutes les commandes ({orders.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData.role === 'user' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Commandes totales</label>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Montant dépensé</label>
                  <p className="text-2xl font-bold">
                    {orders.reduce((total, order) => total + (order.ticket?.price || 0), 0)}€
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Événements assistés</label>
                  <p className="text-2xl font-bold">
                    {/* ✅ CORRECTION : Utilisation de la fonction helper */}
                    {orders.filter(order => isConfirmedOrder(order.status)).length}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Compte créé</label>
                  <p className="font-medium">{new Date(userData.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                  <p className="font-medium">Aujourd'hui</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <Badge variant="default">Actif</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}