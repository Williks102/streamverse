
import { getEventById } from '@/lib/data';
import AISummary from '@/components/AISummary';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {notFound} from 'next/navigation';

interface EventSummaryPageProps {
  params: { id: string };
}

export default async function EventSummaryPage({ params }: EventSummaryPageProps) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  const backLink = event.type === 'live' ? `/live/${event.id}` : `/vod/${event.id}`;

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href={backLink}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Link>
      </Button>
      
      <AISummary 
        eventId={event.id} 
        eventTitle={event.title}
        transcript={event.transcript} 
      />
    </div>
  );
}
