// src/app/promoter/dashboard/page.tsx - AVEC AUTH CLIENT
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import type { AppEvent } from '@/types';
import { PlusCircle, QrCode, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { togglePublishAction } from './actions';
import { testSimpleAction } from '../events/new/actions'; // ✅ Action de test simple
import { useAuthClient } from '@/hooks/useAuthClient'; // ✅ Nouveau hook
import {useEffect, useState, useTransition} from 'react';
import { getAllEvents } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PromoterStats from '@/components/PromoterStats';

export default function PromoterDashboardPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // ✅ Utiliser le hook d'authentification côté client
  const auth = useAuthClient();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await getAllEvents();
        setEvents(allEvents);
      } catch (error) {
        console.error('Dashboard error:', error);
        toast({ 
          title: "Erreur", 
          description: "Impossible de charger les événements.", 
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [toast]);

  // ✅ Test d'authentification client
  const testAuth = async () => {
    try {
      console.log('🧪 Début test authentification client...');
      const result = await auth.testAuth();
      console.log('🧪 Résultat test auth client:', result);
      
      toast({
        title: result.success ? "✅ Auth Client OK" : "❌ Auth Client Failed",
        description: result.success 
          ? `Connecté: ${result.user?.email} | Profil: ${result.profile?.name} (${result.profile?.role})` 
          : `Erreur: ${result.error}`,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('🧪 Erreur test auth client:', error);
      toast({
        title: "❌ Erreur de test",
        description: "Impossible de tester l'authentification",
        variant: "destructive"
      });
    }
  };

  // ✅ Test d'action serveur simple
  const testServerAction = async () => {
    try {
      console.log('🧪 Test action serveur simple...');
      const result = await testSimpleAction();
      console.log('🧪 Résultat action serveur:', result);
      
      toast({
        title: "✅ Action Serveur OK",
        description: `${result.message} | ${result.timestamp}`,
      });
    } catch (error) {
      console.error('🧪 Erreur action serveur:', error);
      toast({
        title: "❌ Action Serveur Failed",
        description: "Erreur lors du test de l'action serveur",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (eventId: string, currentStatus: boolean) => {
    startTransition(async () => {
        try {
            await togglePublishAction(eventId);
            setEvents(events.map(e => e.id === eventId ? { ...e, isPublished: !e.isPublished } : e));
            toast({
                title: "Statut mis à jour",
                description: `L'événement est maintenant ${currentStatus ? 'non publié' : 'publié'}.`,
            });
        } catch (error) {
            console.error('Toggle publish error:', error);
            toast({
                title: "Erreur",
                description: "Échec de la mise à jour du statut de publication.",
                variant: "destructive"
            });
        }
    });
  };

  // Filtrer les événements par type
  const liveEvents = events.filter(e => e.type === 'live');
  const vodEvents = events.filter(e => e.type === 'vod');
  const offlineEvents = events.filter(e => e.type === 'offline');

  const renderEventList = (events: AppEvent[], title: string, emptyMessage: string) => (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="space-y-3">
              <EventCard event={event} />
              <div className="flex items-center justify-between px-1">
                <Label
                  htmlFor={`published-${event.id}`}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Switch
                    id={`published-${event.id}`}
                    checked={event.isPublished}
                    onCheckedChange={(checked) => handleTogglePublish(event.id, event.isPublished)}
                    disabled={isPending}
                  />
                  {event.isPublished ? 'Publié' : 'Non publié'}
                </Label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{emptyMessage}</p>
          <Button asChild className="mt-4">
            <Link href="/promoter/events/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Créer votre premier événement
            </Link>
          </Button>
        </div>
      )}
    </section>
  );

  // ✅ Affichage de loading pendant l'authentification
  if (auth.isLoading || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-96 w-full"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ✅ Status d'authentification */}
      {auth.isAuthenticated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800">✅ Authentifié</h3>
          <p className="text-green-700">
            Connecté en tant que : <strong>{auth.profile?.name || auth.user?.email}</strong> ({auth.profile?.role})
          </p>
        </div>
      )}

      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-4 text-center">
        <h1 className="text-3xl font-bold text-primary">Tableau de Bord Promoteur</h1>
        
        {/* ✅ Zone des boutons avec les boutons de test */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* ✅ Boutons de test */}
          <div className="flex gap-2">
            <Button 
              onClick={testAuth} 
              variant="outline" 
              size="sm"
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              🧪 Test Client
            </Button>
            
            <Button 
              onClick={testServerAction} 
              variant="outline" 
              size="sm"
              className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              🧪 Test Serveur
            </Button>
          </div>
          
          <Button asChild variant="outline">
            <Link href="/promoter/scanner">
              <QrCode className="mr-2 h-5 w-5" /> Scanner un Billet
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/promoter/events/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Créer un événement
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Mes Événements</TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4"/>Statistiques & Simulation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="mt-6">
          <div className="space-y-8">
            {renderEventList(liveEvents, 'Mes Live Streams', "Vous n'avez pas encore créé de live streams.")}
            <Separator />
            {renderEventList(vodEvents, 'Mes VODs', "Vous n'avez pas encore créé de VODs.")}
            <Separator />
            {renderEventList(offlineEvents, 'Mes Événements Physiques', "Vous n'avez pas encore créé d'événements physiques.")}
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <PromoterStats events={events} />
        </TabsContent>
      </Tabs>
    </div>
  );
}