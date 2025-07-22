// src/app/promoter/dashboard/page.tsx - VERSION NETTOYÉE
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import type { AppEvent } from '@/types';
import { PlusCircle, QrCode, BarChart3, LogOut, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { togglePublishAction } from './actions';
import { useAuthClient } from '@/hooks/useAuthClient';
import { useEffect, useState, useTransition } from 'react';
import { getAllEvents } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PromoterStats from '@/components/PromoterStats';
import { useRouter } from 'next/navigation';

export default function PromoterDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
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
      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Tableau de Bord Promoteur</h1>
        
        <div className="flex items-center gap-4">
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2">
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

          {/* Menu utilisateur avec déconnexion */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative h-10 w-10 rounded-full p-0">
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
                    {auth.profile?.name || "Promoteur"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {auth.user?.email}
                  </p>
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
        </div>
      </div>
      
      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Mes Événements</TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4"/>Statistiques
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