// src/app/offline/[id]/page.tsx - Version mise à jour avec TicketSelector
"use client";

import { useState, useEffect } from 'react';
import { EventService } from '@/services/events';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';
import TicketSelector from '@/components/TicketSelector';
import type { AppEvent } from '@/types';

interface OfflineEventPageProps {
  params: Promise<{ id: string }>;
}

export default function OfflineEventPage({ params }: OfflineEventPageProps) {
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTicketSelectorOpen, setIsTicketSelectorOpen] = useState(false);

  // Charger l'événement côté client
  useEffect(() => {
    async function loadEvent() {
      try {
        const resolvedParams = await params;
        const eventData = await EventService.getEventById(resolvedParams.id);
        
        if (!eventData || eventData.type !== 'offline') {
          notFound();
        }
        
        setEvent(eventData);
      } catch (error) {
        console.error('Erreur chargement événement:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEvent();
  }, [params]);

  // Formater la date de manière sécurisée
  const formatEventDate = (dateString?: string | null) => {
    if (!dateString) return 'Date à confirmer';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date à confirmer';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets || []);
  const isFree = lowestPrice === 0;
  const hasTickets = event.tickets && event.tickets.length > 0;

  return (
    <div className="space-y-8">
       <Button variant="outline" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
        </Link>
      </Button>

      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0">
          <div className="relative aspect-video w-full">
            <Image 
              src={event.thumbnailUrl} 
              alt={event.title} 
              fill
              className="object-cover"
              data-ai-hint={event['data-ai-hint']}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
           <div className="flex flex-col md:flex-row justify-between md:items-start mb-2">
              <h1 className="text-3xl font-bold mb-2 md:mb-0">{event.title}</h1>
              <Badge variant={isFree ? 'secondary' : 'default'} className="text-lg px-4 py-2 self-start md:self-auto">
                {isFree ? 'Gratuit' : `À partir de ${lowestPrice.toLocaleString('fr-FR')} XOF`}
              </Badge>
           </div>
           <p className="text-muted-foreground text-lg leading-relaxed mb-6">{event.description}</p>

          {/* Informations de l'événement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span className="font-medium">Date et heure</span>
              </div>
              <p className="text-muted-foreground ml-7">
                {formatEventDate(event.startTime)}
              </p>
            </div>

            {event.location && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">Lieu</span>
                </div>
                <p className="text-muted-foreground ml-7">
                  {event.location}
                  {event.address && <><br />{event.address}</>}
                </p>
              </div>
            )}
          </div>

          {/* Informations du promoteur */}
          {event.promoterInfo && (
            <div className="border-t pt-6 mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={event.promoterInfo.avatarUrl || undefined} 
                    alt={event.promoterInfo.name} 
                  />
                  <AvatarFallback>
                    {event.promoterInfo.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Organisé par</p>
                  <p className="text-lg font-bold">{event.promoterInfo.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Types de billets disponibles */}
          {hasTickets && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Billets disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.tickets!.map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center p-3 bg-background rounded border">
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {ticket.price === 0 ? 'Gratuit' : `${ticket.price.toLocaleString('fr-FR')} XOF`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bouton d'achat avec Dialog */}
          {hasTickets && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Dialog open={isTicketSelectorOpen} onOpenChange={setIsTicketSelectorOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex-1">
                    <Ticket className="mr-2 h-5 w-5" />
                    {isFree ? 'Réserver Gratuitement' : 'Acheter des Billets'}
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Sélection de billets</DialogTitle>
                  </DialogHeader>
                  <TicketSelector 
                    event={event} 
                    onClose={() => setIsTicketSelectorOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}