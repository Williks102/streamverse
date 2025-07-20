// ===================================================
// 📁 src/app/promoter/dashboard/page.tsx (UUID CORRIGÉ)
// ===================================================

"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import type { AppEvent } from '@/types';
import { PlusCircle, QrCode, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { togglePublishAction } from './actions';
import {useEffect, useState, useTransition} from 'react';
import { getAllEvents } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PromoterStats from '@/components/PromoterStats';

// ✅ UUID VALIDE maintenant
const MOCK_PROMOTER_ID = '550e8400-e29b-41d4-a716-446655440000';

export default function PromoterDashboardPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Récupère tous les événements pour l'instant
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
            <EventCard
              key={event.id}
              event={event}
              managementMode={true}
              onTogglePublish={(
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`publish-${event.id}`}
                    checked={event.isPublished}
                    onCheckedChange={() => handleTogglePublish(event.id, event.isPublished)}
                    disabled={isPending}
                  />
                  <Label 
                    htmlFor={`publish-${event.id}`} 
                    className="text-xs cursor-pointer"
                  >
                    {event.isPublished ? 'Publié' : 'Non publié'}
                  </Label>
                </div>
              )}
            />
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

  if (isLoading) {
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
      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-4 text-center">
        <h1 className="text-3xl font-bold text-primary">Tableau de Bord Promoteur</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
          <TabsTrigger value="stats"><BarChart3 className="mr-2 h-4 w-4"/>Statistiques & Simulation</TabsTrigger>
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

// ===================================================
// 📁 Aussi, il faut fixer le formulaire de création
// ===================================================

// Trouvez votre formulaire de création d'événement et assurez-vous
// qu'il utilise le même UUID pour promoter_id :
// '550e8400-e29b-41d4-a716-446655440000'