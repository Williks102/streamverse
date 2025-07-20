
import { getEventById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Video } from 'lucide-react';
import { getLowestPrice } from '@/lib/utils';

interface ConfirmationPageProps {
  params: { id: string };
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }
  
  const eventLink = event.type === 'live' ? `/live/${event.id}` : `/vod/${event.id}`;
  const lowestPrice = getLowestPrice(event.tickets);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl">Paiement Réussi !</CardTitle>
          <CardDescription>
            Merci pour votre achat. Votre accès a été confirmé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Image 
                src={event.thumbnailUrl} 
                alt={event.title} 
                width={160} 
                height={90} 
                className="rounded-lg aspect-video object-cover"
                data-ai-hint="event poster"
            />
            <div className="text-center">
                <h3 className="font-bold text-xl">{event.title}</h3>
                <p className="text-muted-foreground">{event.category}</p>
                <p className="font-semibold text-primary mt-1">À partir de {lowestPrice.toLocaleString('fr-FR')} XOF</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Vous pouvez maintenant accéder à l'événement. Un reçu a été envoyé à votre adresse e-mail (simulation).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button asChild size="lg" className="flex-1">
              <Link href={eventLink}>
                <Video className="mr-2 h-5 w-5" />
                Accéder à l'événement
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
