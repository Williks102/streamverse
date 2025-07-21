// ===================================================
// 📁 src/app/promoter/events/new/actions.ts (CORRIGÉ Next.js 15)
// ===================================================

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AppEvent } from '@/types';
import type { Database } from '@/types/database';

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

// ✅ Fonction helper pour créer le client Supabase server-side
async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // ✅ Next.js 15 - await cookies()
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          // ✅ Implémentation custom pour les cookies server-side
          getItem: (key: string) => {
            return cookieStore.get(key)?.value || null;
          },
          setItem: (key: string, value: string) => {
            cookieStore.set(key, value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });
          },
          removeItem: (key: string) => {
            cookieStore.delete(key);
          },
        },
      },
    }
  );
}

export async function createEventAction(values: z.infer<typeof formSchema>) {
  try {
    console.log('🚀 Début création événement avec auth...');

    // ✅ 1. Créer le client Supabase avec la nouvelle méthode
    const supabase = await createSupabaseServerClient();

    // ✅ 2. Vérifier que l'utilisateur est connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Utilisateur non authentifié');
      redirect('/auth/login');
    }

    console.log('✅ Utilisateur connecté:', user.email);

    // ✅ 3. Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Profil non trouvé');
      throw new Error('Profil utilisateur non trouvé');
    }

    if (profile.role !== 'promoter') {
      console.log('❌ Utilisateur pas promoteur');
      throw new Error('Accès refusé : vous devez être un promoteur');
    }

    console.log('✅ Promoteur validé:', profile.name);

    // ✅ 4. Créer l'événement avec l'ID du vrai utilisateur connecté
    const newEvent: Omit<AppEvent, 'id'> = {
      title: values.title,
      description: values.description,
      thumbnailUrl: values.thumbnailUrl,
      'data-ai-hint': values.category?.toLowerCase() || '',
      category: values.category,
      type: values.type,
      isPublished: values.isPublished,
      startTime: values.startTime || null,
      duration: null,
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
      
      // ✅ VRAI ID et infos du promoteur connecté
      promoterInfo: {
        id: user.id, // 🎯 ID dynamique de l'utilisateur connecté
        name: profile.name || user.email?.split('@')[0] || 'Promoteur',
        avatarUrl: profile.avatar_url || 'https://placehold.co/40x40.png',
      },
      
      transcript: '',
    };

    console.log('📝 Création événement pour promoteur:', user.id);

    // ✅ 5. Créer l'événement
    const createdEvent = await EventService.createEvent(newEvent);
    
    console.log('✅ Événement créé avec succès:', createdEvent.id);

    revalidatePath('/promoter/dashboard');
    
    return { success: true, event: createdEvent };
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw new Error("Échec de la création de l'événement.");
  }
}

// ✅ Action pour récupérer l'utilisateur actuel (utile pour les composants)
export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      profile: profile,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}