// src/app/promoter/events/new/actions.ts - APPROCHE HYBRIDE CLIENT/SERVEUR
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import type { AppEvent } from '@/types';

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
  thumbnailUrl: z.string(),
  tickets: z.array(ticketSchema),
  videoSrc: z.string().url().optional().or(z.literal('')),
  startTime: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
});

// ✅ NOUVELLE APPROCHE: Recevoir les données utilisateur depuis le client
export async function createEventAction(
  values: z.infer<typeof formSchema>,
  userInfo: {
    id: string;
    email: string;
    profileId: string;
    profileName: string;
    profileRole: string;
    avatarUrl?: string;
  }
) {
  try {
    console.log('🚀 [SERVER ACTION] Début création événement...');
    console.log('📝 [DEBUG] User info reçu:', userInfo);
    console.log('📝 [DEBUG] Données reçues:', {
      title: values.title,
      type: values.type,
      category: values.category
    });

    // ✅ 1. Vérifier que l'utilisateur est bien un promoteur
    if (userInfo.profileRole !== 'promoter') {
      console.log('❌ [ERROR] Rôle incorrect:', userInfo.profileRole);
      throw new Error(`Accès refusé : rôle requis 'promoter', rôle actuel '${userInfo.profileRole}'`);
    }

    console.log('✅ [SUCCESS] Promoteur validé:', {
      id: userInfo.profileId,
      name: userInfo.profileName,
      role: userInfo.profileRole
    });

    // ✅ 2. Préparer les données de l'événement
    const newEvent: Omit<AppEvent, 'id'> = {
      title: values.title,
      description: values.description,
      thumbnailUrl: values.thumbnailUrl,
      'data-ai-hint': values.category?.toLowerCase() || '',
      category: values.category,
      type: values.type,
      isPublished: values.isPublished,
      startTime: values.startTime || null,
      duration: values.type === 'vod' ? '0:00:00' : null,
      videoSrc: values.videoSrc || null,
      location: values.location || null,
      address: values.address || null,
      status: values.type === 'live' ? 'upcoming' : 
              values.type === 'vod' ? 'available' : 'scheduled',
      tickets: values.tickets.map((ticket, index) => ({
        id: `temp-ticket-${index}-${Date.now()}`,
        name: ticket.name,
        price: Number(ticket.price)
      })),
      promoterInfo: {
        id: userInfo.id,
        name: userInfo.profileName || userInfo.email.split('@')[0] || 'Promoteur',
        avatarUrl: userInfo.avatarUrl || 'https://placehold.co/40x40.png',
      },
      transcript: '',
    };

    console.log('📝 [DEBUG] Données événement préparées:', {
      title: newEvent.title,
      promoterId: newEvent.promoterInfo?.id,
      ticketsCount: newEvent.tickets?.length
    });

    // ✅ 3. Créer l'événement
    console.log('💾 [DEBUG] Création de l\'événement...');
    const createdEvent = await EventService.createEvent(newEvent);
    
    console.log('✅ [SUCCESS] Événement créé:', {
      id: createdEvent.id,
      title: createdEvent.title,
      promoter: createdEvent.promoterInfo?.name
    });

    // ✅ 4. Revalider le cache
    revalidatePath('/promoter/dashboard');
    
    return { 
      success: true, 
      event: createdEvent,
      message: 'Événement créé avec succès'
    };
    
  } catch (error) {
    console.error('❌ [FATAL ERROR] Création événement échouée:', error);
    
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Erreur inconnue lors de la création de l'événement");
    }
  }
}

// ✅ Action simplifiée pour tester (sans auth Supabase côté serveur)
export async function testSimpleAction() {
  console.log('🧪 [TEST SIMPLE] Action serveur appelée avec succès');
  return {
    success: true,
    message: 'Action serveur fonctionne !',
    timestamp: new Date().toISOString()
  };
}