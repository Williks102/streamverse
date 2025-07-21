// ===================================================
// 📁 src/app/offline/[id]/page.tsx (CORRIGÉ)
// ===================================================

import { EventService } from '@/services/events'; // ✅ Service Supabase
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';

interface OfflineEventPageProps {
  params: Promise<{ id: string }>; // ✅ Next.js 15 - params est une Promise
}

export default async function OfflineEventPage({ params }: OfflineEventPageProps) {
  // ✅ Await params pour Next.js 15
  const { id } = await params;
  
  // ✅ Utiliser le service Supabase au lieu des mocks
  const event = await EventService.getEventById(id);

  if (!event || event.type !== 'offline') {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets || []);
  const isFree = lowestPrice === 0;
  const checkoutLink = `/events/${event.id}/checkout`;

  // ✅ Formater la date de manière sécurisée
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
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-muted-foreground">
            <Badge variant="outline">{event.category}</Badge>
            {event.promoterInfo && (
              <div className="flex items-center text-sm gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={event.promoterInfo.avatarUrl} />
                  <AvatarFallback><User size={12} /></AvatarFallback>
                </Avatar>
                <span>Par {event.promoterInfo.name}</span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            {event.description}
          </p>

          {/* ✅ Informations de l'événement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Date et Heure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{formatEventDate(event.startTime)}</p>
              </CardContent>
            </Card>

            {event.location && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lieu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{event.location}</p>
                  {event.address && (
                    <p className="text-sm text-muted-foreground mt-1">{event.address}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ✅ Billets disponibles */}
          {event.tickets && event.tickets.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Billets Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{ticket.name}</h4>
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

          {/* ✅ Bouton d'achat */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="flex-1">
              <Link href={checkoutLink}>
                <Ticket className="mr-2 h-5 w-5" />
                {isFree ? 'Réserver Gratuitement' : 'Acheter des Billets'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}