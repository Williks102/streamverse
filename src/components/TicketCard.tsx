
import type { Order } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Download, MapPin, QrCode, Ticket } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface TicketCardProps {
  order: Order;
}

export default function TicketCard({ order }: TicketCardProps) {
  const { event, ticket, purchaseDate } = order;

  const getEventLink = () => {
    switch (event.type) {
      case 'live': return `/live/${event.id}`;
      case 'vod': return `/vod/${event.id}`;
      case 'offline': return `/offline/${event.id}`;
      default: return '#';
    }
  };

  const formattedPurchaseDate = new Date(purchaseDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg">
      <CardHeader>
        <div className="flex gap-4">
          <Image
            src={event.thumbnailUrl}
            alt={event.title}
            width={120}
            height={67}
            className="rounded-lg aspect-video object-cover"
            data-ai-hint={event['data-ai-hint'] || 'event poster'}
          />
          <div className="flex-1">
            <Badge variant="outline" className="mb-1">{event.category}</Badge>
            <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
            <CardDescription className="text-xs">Acheté le {formattedPurchaseDate}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <Separator />
        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
            <div>
                <p className="text-sm text-muted-foreground">Type de Billet</p>
                <p className="font-bold">{ticket.name}</p>
            </div>
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Prix Payé</p>
                <p className="font-bold">{ticket.price.toLocaleString('fr-FR')} XOF</p>
            </div>
        </div>

        {event.type === 'offline' && (
          <div className="space-y-2 text-sm">
             {event.startTime && (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary"/> 
                    <span>{new Date(event.startTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
             )}
             {event.startTime && (
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary"/> 
                    <span>{new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
             )}
            {event.location && (
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary"/> 
                    <span>{event.location}, {event.address}</span>
                </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button asChild className="w-full flex-1" variant="secondary">
          <Link href={getEventLink()}>
            Voir l'Événement
          </Link>
        </Button>
        {event.type === 'offline' && (
            <Button asChild className="w-full flex-1">
                <Link href={`/ticket/${order.id}/print`} target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le Billet
                </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
