// src/app/live/[id]/page.tsx - Corrections des types
import { getEventById } from '@/lib/data';
import VideoPlayer from '@/components/VideoPlayer';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, Ticket } from 'lucide-react';
import { notFound } from 'next/navigation';
import LiveChat from '@/components/LiveChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLowestPrice } from '@/lib/utils';

interface LiveStreamPageProps {
  params: Promise<{ id: string }>; // ✅ Next.js 15 - params est une Promise
}

export default async function LiveStreamPage({ params }: LiveStreamPageProps) {
  const { id } = await params; // ✅ Await params
  const event = await getEventById(id);

  if (!event || event.type !== 'live') {
    notFound();
  }
  
  const lowestPrice = getLowestPrice(event.tickets || []); // ✅ Fallback pour tickets
  const isFree = lowestPrice === 0;
  const checkoutLink = `/events/${event.id}/checkout`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/live">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Live Streams
          </Link>
        </Button>

        {isFree ? (
          <VideoPlayer 
            src={event.videoSrc} // ✅ Peut être null/undefined maintenant
            thumbnailUrl={event.thumbnailUrl} 
            isLive 
            title={event.title} 
            data-ai-hint={event['data-ai-hint']} // ✅ Peut être null/undefined
          />
        ) : (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl group w-full flex flex-col items-center justify-center text-center p-8">
            <Ticket size={64} className="text-primary mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Accès Payant</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Cet événement est disponible à l'achat. Obtenez votre accès pour regarder le flux en direct.
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

          <p className="text-muted-foreground mb-4">{event.description}</p>

          {event.promoterInfo && (
            <div className="flex items-center space-x-3 mb-4">
              <Avatar>
                <AvatarImage src={event.promoterInfo.avatarUrl} alt={event.promoterInfo.name} />
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Organisé par {event.promoterInfo.name}</p>
                <p className="text-sm text-muted-foreground">Promoteur Officiel</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href={`/events/${event.id}/summary`}>
                <FileText className="mr-2 h-4 w-4" />
                Voir le Résumé
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <LiveChat eventId={event.id} />
      </div>
    </div>
  );
}