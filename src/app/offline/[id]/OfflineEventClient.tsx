"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';
import TicketSelector from '@/components/TicketSelector';
import type { AppEvent } from '@/types';

interface OfflineEventClientProps {
  event: AppEvent;
}

export default function OfflineEventClient({ event }: OfflineEventClientProps) {
  const [isTicketSelectorOpen, setIsTicketSelectorOpen] = useState(false);

  const formatEventDate = (dateString?: string | null) => {
    if (!dateString) return 'Date à confirmer';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Date invalide';
    }
  };

  const lowestPrice = getLowestPrice(event.tickets || []);
  const isFree = lowestPrice === 0;
  const hasMultipleTicketTypes = (event.tickets?.length || 0) > 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/offline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux événements
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
            <Image
              src={event.thumbnailUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              data-ai-hint={event['data-ai-hint'] || 'event poster'}
            />
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">{event.category}</Badge>
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            {/* Informations pratiques */}
            <div className="grid gap-3 mb-6">
              {event.startTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-5 w-5" />
                  <span>{formatEventDate(event.startTime)}</span>
                </div>
              )}
              
              {event.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>Durée: {event.duration}</span>
                </div>
              )}
              
              {event.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none">
              <p>{event.description}</p>
            </div>
          </div>

          {/* Informations sur l'adresse */}
          {event.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse complète
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{event.address}</p>
                <Button variant="outline" asChild className="mt-4">
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Voir sur Google Maps
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Card de réservation */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {isFree ? 'Gratuit' : `À partir de ${lowestPrice.toLocaleString('fr-FR')} XOF`}
                </span>
              </div>

              {hasMultipleTicketTypes && (
                <p className="text-sm text-muted-foreground">
                  {(event.tickets?.length ?? 0)} types de billets disponibles
                </p>
              )}

              <Dialog open={isTicketSelectorOpen} onOpenChange={setIsTicketSelectorOpen}>
                <Button 
                  onClick={() => setIsTicketSelectorOpen(true)}
                  className="w-full" 
                  size="lg"
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  {isFree ? 'Réserver gratuitement' : 'Choisir mes billets'}
                </Button>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Sélection des billets</DialogTitle>
                  </DialogHeader>
                  <TicketSelector 
                    event={event} 
                    onClose={() => setIsTicketSelectorOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Billets électroniques disponibles
                </p>
                <p>Les billets seront envoyés par email après le paiement</p>
              </div>
            </CardContent>
          </Card>

          {/* Organisateur */}
          {event.promoterInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Organisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={event.promoterInfo.avatarUrl} />
                    <AvatarFallback>
                      {event.promoterInfo.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{event.promoterInfo.name}</p>
                    <p className="text-sm text-muted-foreground">Promoteur vérifié</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}