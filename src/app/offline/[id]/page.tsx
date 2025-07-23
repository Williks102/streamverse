// src/app/offline/[id]/page.tsx - VERSION OPTIMISÉE
import { EventService } from '@/services/events';
import { notFound } from 'next/navigation';
import OfflineEventClient from './OfflineEventClient';

interface OfflineEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function OfflineEventPage({ params }: OfflineEventPageProps) {
  const resolvedParams = await params;
  const event = await EventService.getEventById(resolvedParams.id);
  
  if (!event || event.type !== 'offline') {
    notFound();
  }
  
  return <OfflineEventClient event={event} />;
}

