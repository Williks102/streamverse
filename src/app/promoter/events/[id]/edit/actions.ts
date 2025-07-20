
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';

const ticketSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number().min(0),
});

const formSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  type: z.enum(['live', 'vod', 'offline']),
  isPublished: z.boolean(),
  thumbnailUrl: z.string(), // Can be a URL or a data URI
  tickets: z.array(ticketSchema),
  // Online fields
  videoSrc: z.string().url().optional().or(z.literal('')),
  startTime: z.string().optional(),
  // Offline fields
  location: z.string().optional(),
  address: z.string().optional(),
});

export async function updateEventAction(eventId: string, values: z.infer<typeof formSchema>) {
    const existingEvent = await EventService.getEventById(eventId);

    if (!existingEvent) {
        throw new Error("Événement non trouvé");
    }

    const updatedEventData = {
        ...existingEvent,
        ...values,
        tickets: values.tickets.map(t => ({...t, id: t.id.startsWith('new-') ? `ticket-${Date.now()}-${Math.random()}` : t.id})),
        ...(values.type === 'live' && {
            startTime: values.startTime,
            videoSrc: existingEvent.videoSrc,
            status: 'upcoming',
        }),
        ...(values.type === 'vod' && {
            videoSrc: values.videoSrc,
            startTime: undefined,
            status: 'recorded',
        }),
        ...(values.type === 'offline' && {
            startTime: values.startTime,
            location: values.location,
            address: values.address,
            status: 'scheduled',
        }),
    };

    await EventService.updateEvent(eventId, updatedEventData);

    console.log('Event updated:', eventId, updatedEventData);

    revalidatePath('/promoter/dashboard');
    revalidatePath(`/promoter/events/${eventId}/edit`);
    if (updatedEventData.type === 'live') {
      revalidatePath(`/live/${eventId}`);
    } else if (updatedEventData.type === 'vod') {
      revalidatePath(`/vod/${eventId}`);
    } else {
      revalidatePath(`/offline/${eventId}`);
    }
}

    
