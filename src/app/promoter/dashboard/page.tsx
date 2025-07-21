"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import type { AppEvent } from '@/types';
import { PlusCircle, QrCode, BarChart3, LogOut, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { togglePublishAction } from './actions';
import { useEffect, useState, useTransition } from 'react';
import { EventService } from '@/services/events';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PromoterStats from '@/components/PromoterStats';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PromoterDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Charger les événements du promoteur connecté
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log('📊 Chargement des événements pour:', user.id);
        
        const promoterEvents = await EventService.getEventsByPromoterId(user.id);
        setEvents(promoterEvents);
        
        console.log('✅ Événements chargés:', promoterEvents.length);
      } catch (error) {
        console.error('❌ Erreur dashboard:', error);
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
  }, [user, toast]);

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
        console.error('❌ Erreur toggle publish:', error);
        toast({
          title: "Erreur",
          description: "Échec de la mise à jour du statut de publication.",
          variant: "destructive"
        });
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion.",
        variant: "destructive"
      });
    }
  };

  // Loading state pendant l'authentification
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user || !profile) {
    return null;
  }

  // Filtrer les événements par type
  const liveEvents = events.filter(e => e.type === 'live');
  const vodEvents = events.filter(e => e.type === 'vod');
  const offlineEvents = events.filter(e => e.type === 'offline');

  const renderEventList = (eventList: AppEvent[], title: string, emptyMessage: string) => (
    <section>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      {eventList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventList.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              managementMode 
              onTogglePublish={(
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`publish-${event.id}`}
                    checked={event.isPublished}
                    onCheckedChange={() => handleTogglePublish(event.id, event.isPublished)}
                    disabled={isPending}
                    aria-label="Toggle event publication status"
                  />
                  <Label htmlFor={`publish-${event.id}`} className="text-sm">
                    {event.isPublished ? 'Publié' : 'Non publié'}
                  </Label>
                </div>
              )}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Separator />
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-96 w-full"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec info utilisateur */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Tableau de Bord Promoteur
            </h1>
            <p className="text-muted-foreground">
              Bienvenue {profile.name || user.email}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> 
            Déconnexion
          </Button>
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

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter(e => e.isPublished).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements Physiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineEvents.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Mes Événements</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="mr-2 h-4 w-4"/>Statistiques</TabsTrigger>
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