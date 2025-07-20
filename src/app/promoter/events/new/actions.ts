
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import type { AppEvent } from '@/types';

// This is a mock promoter ID. In a real app, you'd get this from the user's session.
const MOCK_PROMOTER_ID = 'promoter-1';
const MOCK_PROMOTER_NAME = 'AI Conf Inc.';
const MOCK_PROMOTER_AVATAR = 'https://placehold.co/40x40.png';

const ticketSchema = z.object({
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

export async function createEventAction(values: z.infer<typeof formSchema>) {
    const newEvent: AppEvent = {
        id: `${values.type}-${Date.now()}`, // Simple unique ID
        title: values.title,
        description: values.description,
        thumbnailUrl: values.thumbnailUrl,
        category: values.category,
        type: values.type,
        isPublished: values.isPublished,
        tickets: values.tickets.map(ticket => ({
            ...ticket, 
            id: `ticket-${Date.now()}-${Math.random()}`,
            price: Number(ticket.price) // Ensure price is a number
        })),
        promoterInfo: {
            id: MOCK_PROMOTER_ID,
            name: MOCK_PROMOTER_NAME,
            avatarUrl: MOCK_PROMOTER_AVATAR,
        },
        // Add type-specific properties
        ...((values.type === 'live' || values.type === 'offline') && {
            startTime: values.startTime,
        }),
        ...(values.type === 'live' && {
            status: 'upcoming',
            videoSrc: 'placeholder_live_video_src_new', // Placeholder for live
        }),
        ...(values.type === 'vod' && {
            status: 'recorded',
            videoSrc: values.videoSrc,
            duration: '0:00:00', // Placeholder duration
        }),
        ...(values.type === 'offline' && {
            status: 'scheduled',
            location: values.location,
            address: values.address,
        }),
    };
    
    await EventService.createEvent(newEvent);

    console.log('New event created:', newEvent);

    revalidatePath('/promoter/dashboard');
}

    