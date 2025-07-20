
import { getEventById } from '@/lib/data';
import VideoPlayer from '@/components/VideoPlayer';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FileText, User, Ticket } from 'lucide-react';
import {notFound} from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';

interface VodPageProps {
  params: { id: string };
}

export default async function VodPage({ params }: VodPageProps) {
  const event = await getEventById(params.id);

  if (!event || event.type !== 'vod') {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets);
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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
          <Badge variant="outline">{event.category}</Badge>
          {event.duration && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock size={16} className="mr-1" />
              <span>{event.duration}</span>
            </div>
          )}
          {event.promoterInfo && (
            <div className="flex items-center text-sm text-muted-foreground gap-1.5">
               {event.promoterInfo.avatarUrl ? (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={event.promoterInfo.avatarUrl} alt={event.promoterInfo.name} data-ai-hint="promoter logo"/>
                    <AvatarFallback>{event.promoterInfo.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <User size={14} />
                )}
              <span>Hosted by {event.promoterInfo.name}</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">{event.description}</p>
        
        <Button asChild variant="link" className="p-0 h-auto text-primary hover:text-accent">
          <Link href={`/events/${event.id}/summary`}>
            <FileText className="mr-2 h-4 w-4" />
            View/Generate Event Summary
          </Link>
        </Button>
      </section>

      {/* Placeholder for comments section */}
      <section className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <div className="h-48 border border-dashed border-border rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">(Comments Feature Coming Soon)</p>
        </div>
      </section>
    </div>
  );
}
