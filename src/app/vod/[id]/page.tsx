// ===================================================
// 📁 src/app/vod/[id]/page.tsx (CORRIGÉ)
// ===================================================

import { EventService } from '@/services/events';
import VideoPlayer from '@/components/VideoPlayer';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FileText, User, Ticket } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';

interface VodPageProps {
  params: Promise<{ id: string }>;
}

export default async function VodPage({ params }: VodPageProps) {
  const { id } = await params;
  const event = await EventService.getEventById(id);

  if (!event || event.type !== 'vod') {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets || []);
  const isFree = lowestPrice === 0;
  const checkoutLink = `/events/${event.id}/checkout`;

  return (
    <div className="space-y-8">
       <Button variant="outline" asChild className="mb-4">
        <Link href="/vod">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to VODs
        </Link>
      </Button>

      {isFree ? (
        <VideoPlayer 
          src={event.videoSrc} 
          thumbnailUrl={event.thumbnailUrl} 
          title={event.title}
          data-ai-hint={event['data-ai-hint']}
        />
      ) : (
         <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl group w-full flex flex-col items-center justify-center text-center p-8">
            <Ticket size={64} className="text-primary mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Accès Payant</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                Cet événement est disponible à l'achat. Obtenez votre accès pour regarder le contenu complet.
            </p>
            <Button asChild size="lg">
                <Link href={checkoutLink}>
                    Acheter l'accès (à partir de {lowestPrice.toLocaleString('fr-FR')} XOF)
                </Link>
            </Button>
         </div>
      )}

      <section className="bg-card p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between md:items-start mb-2">
            <h1 className="text-3xl font-bold mb-2 md:mb-0">{event.title}</h1>
            <Badge variant={isFree ? 'secondary' : 'default'} className="text-lg px-4 py-2 self-start md:self-auto">
              {isFree ? 'Gratuit' : `À partir de ${lowestPrice.toLocaleString('fr-FR')} XOF`}
            </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-muted-foreground">
          <Badge variant="outline">{event.category}</Badge>
          {event.duration && (
            <div className="flex items-center text-sm gap-1">
              <Clock size={14} />
              <span>{event.duration}</span>
            </div>
          )}
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

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {!isFree && (
            <Button asChild size="lg" className="flex-1">
              <Link href={checkoutLink}>
                <Ticket className="mr-2 h-5 w-5" />
                Acheter l'accès
              </Link>
            </Button>
          )}
          
          {event.transcript && (
            <Button variant="outline" asChild size="lg" className="flex-1">
              <Link href={`/events/${event.id}/summary`}>
                <FileText className="mr-2 h-5 w-5" />
                Voir le résumé IA
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}