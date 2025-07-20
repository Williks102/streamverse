
import { getEventById } from '@/lib/data';
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
  params: { id: string };
}

export default async function OfflineEventPage({ params }: OfflineEventPageProps) {
  const event = await getEventById(params.id);

  if (!event || event.type !== 'offline') {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets);
  const isFree = lowestPrice === 0;
  const checkoutLink = `/events/${event.id}/checkout`;

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
                {event.promoterInfo.avatarUrl ? (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={event.promoterInfo.avatarUrl} alt={event.promoterInfo.name} data-ai-hint="promoter logo"/>
                      <AvatarFallback>{event.promoterInfo.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <User size={14} />
                  )}
                <span>Organisé par {event.promoterInfo.name}</span>
              </div>
            )}
          </div>
          
          <p className="text-muted-foreground mb-6">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="text-primary" /> Informations Pratiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.startTime && (
                  <div className="flex items-start gap-2">
                    <Clock size={18} className="mt-1" />
                    <div>
                      <p className="font-semibold">Date et Heure</p>
                      <p>{new Date(event.startTime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="mt-1" />
                    <div>
                      <p className="font-semibold">{event.location}</p>
                      {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
             <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ticket className="text-primary" /> Billetterie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p>Achetez vos billets pour participer à cet événement inoubliable.</p>
                 <Button asChild size="lg" className="w-full">
                    <Link href={checkoutLink}>
                      Acheter un billet
                    </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-xl mb-4">Emplacement</h3>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">(Intégration de carte à venir)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
