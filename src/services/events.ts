import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { AppEvent } from '@/types';

// Types Supabase pour faciliter le travail
type DbEvent = Database['public']['Tables']['events']['Row'];
type DbEventInsert = Database['public']['Tables']['events']['Insert'];
type DbEventUpdate = Database['public']['Tables']['events']['Update'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbTicket = Database['public']['Tables']['tickets']['Row'];

// Interface pour les données enrichies depuis Supabase
interface SupabaseEventWithRelations extends DbEvent {
  profiles?: DbProfile | null;
  tickets?: DbTicket[];
}

// ✅ Conversion CORRIGÉE des données Supabase vers AppEvent
function convertSupabaseToAppEvent(supabaseData: SupabaseEventWithRelations): AppEvent {
  return {
    id: supabaseData.id,
    title: supabaseData.title,
    description: supabaseData.description || '',
    thumbnailUrl: supabaseData.thumbnail_url || 'https://placehold.co/600x400.png',
    'data-ai-hint': supabaseData.category?.toLowerCase() || '',
    category: supabaseData.category || 'General',
    type: supabaseData.type,
    isPublished: supabaseData.is_published,
    status: (supabaseData.status as AppEvent['status']) || 'scheduled',
    // ✅ CORRECTION : Gestion des null/undefined
    startTime: supabaseData.start_time || undefined,
    duration: supabaseData.duration || undefined, 
    videoSrc: supabaseData.video_src || undefined,
    location: supabaseData.location || undefined,
    address: supabaseData.address || undefined,
    tickets: supabaseData.tickets?.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price
    })) || [],
    transcript: '', // À implémenter plus tard
    promoterInfo: supabaseData.profiles ? {
      id: supabaseData.profiles.id,
      name: supabaseData.profiles.name || 'Unknown',
      avatarUrl: supabaseData.profiles.avatar_url || 'https://placehold.co/40x40.png'
    } : null,
  };
}

// ✅ Conversion CORRIGÉE d'AppEvent vers Supabase
function convertAppEventToSupabase(event: Partial<AppEvent>): DbEventInsert {
  return {
    title: event.title!,
    description: event.description || null,
    type: event.type!,
    category: event.category || null,
    thumbnail_url: event.thumbnailUrl || 'https://placehold.co/600x400.png',
    is_published: event.isPublished || false,
    status: event.status || null,
    // ✅ CORRECTION : Conversion undefined vers null
    start_time: event.startTime || null,
    duration: event.duration || null,
    video_src: event.videoSrc || null,
    location: event.location || null,
    address: event.address || null,
    promoter_id: event.promoterInfo?.id || null,
  };
}

class SupabaseEventService {
  // Obtenir tous les événements
  async getAllEvents(): Promise<AppEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url),
          tickets (id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return (data || []).map(convertSupabaseToAppEvent);
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      return [];
    }
  }

  // Obtenir un événement par ID
  async getEventById(id: string): Promise<AppEvent | undefined> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url),
          tickets (id, name, price)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return undefined;
      }

      return data ? convertSupabaseToAppEvent(data) : undefined;
    } catch (error) {
      console.error('Error in getEventById:', error);
      return undefined;
    }
  }

  // Obtenir les événements d'un promoteur
  async getEventsByPromoterId(promoterId: string): Promise<AppEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url),
          tickets (id, name, price)
        `)
        .eq('promoter_id', promoterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promoter events:', error);
        return [];
      }

      return (data || []).map(convertSupabaseToAppEvent);
    } catch (error) {
      console.error('Error in getEventsByPromoterId:', error);
      return [];
    }
  }

  // Créer un nouvel événement
  async createEvent(event: Omit<AppEvent, 'id'>): Promise<AppEvent> {
    try {
      // 1. Créer l'événement
      const eventData = convertAppEventToSupabase(event);

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url)
        `)
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        throw new Error(`Failed to create event: ${eventError.message}`);
      }

      if (!newEvent) {
        throw new Error('No event returned after creation');
      }

      // 2. Créer les billets s'il y en a
      if (event.tickets && event.tickets.length > 0) {
        const ticketsData: Database['public']['Tables']['tickets']['Insert'][] = 
          event.tickets.map(ticket => ({
            event_id: newEvent.id,
            name: ticket.name,
            price: ticket.price,
          }));

        const { error: ticketsError } = await supabase
          .from('tickets')
          .insert(ticketsData);

        if (ticketsError) {
          console.error('Error creating tickets:', ticketsError);
          // Continue même si les billets échouent
        }
      }

      // 3. Récupérer l'événement complet avec les billets
      const createdEvent = await this.getEventById(newEvent.id);
      if (!createdEvent) {
        throw new Error('Failed to retrieve created event');
      }

      return createdEvent;
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw new Error('Failed to create event');
    }
  }

  // Mettre à jour un événement
  async updateEvent(eventId: string, updatedData: Partial<AppEvent>): Promise<AppEvent> {
    try {
      const eventData: DbEventUpdate = {
        ...(updatedData.title && { title: updatedData.title }),
        ...(updatedData.description !== undefined && { description: updatedData.description || null }),
        ...(updatedData.type && { type: updatedData.type }),
        ...(updatedData.category !== undefined && { category: updatedData.category || null }),
        ...(updatedData.thumbnailUrl !== undefined && { thumbnail_url: updatedData.thumbnailUrl || null }),
        ...(updatedData.isPublished !== undefined && { is_published: updatedData.isPublished }),
        ...(updatedData.status !== undefined && { status: updatedData.status || null }),
        ...(updatedData.startTime !== undefined && { start_time: updatedData.startTime || null }),
        ...(updatedData.duration !== undefined && { duration: updatedData.duration || null }),
        ...(updatedData.videoSrc !== undefined && { video_src: updatedData.videoSrc || null }),
        ...(updatedData.location !== undefined && { location: updatedData.location || null }),
        ...(updatedData.address !== undefined && { address: updatedData.address || null }),
      };
      
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }

      const updatedEvent = await this.getEventById(eventId);
      if (!updatedEvent) {
        throw new Error('Failed to retrieve updated event');
      }

      return updatedEvent;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw new Error('Failed to update event');
    }
  }

  // Basculer le statut de publication
  async toggleEventPublished(eventId: string): Promise<void> {
    try {
      // 1. Récupérer l'état actuel
      const { data: currentEvent, error: fetchError } = await supabase
        .from('events')
        .select('is_published')
        .eq('id', eventId)
        .single();

      if (fetchError || !currentEvent) {
        console.error('Error fetching event for toggle:', fetchError);
        throw new Error('Event not found');
      }

      // 2. Inverser le statut
      const { error: updateError } = await supabase
        .from('events')
        .update({ is_published: !currentEvent.is_published })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error toggling event publication:', updateError);
        throw new Error('Failed to toggle event publication');
      }
    } catch (error) {
      console.error('Error in toggleEventPublished:', error);
      throw new Error('Failed to toggle event publication');
    }
  }

  // Obtenir les événements publiés
  async getPublishedEvents(): Promise<AppEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url),
          tickets (id, name, price)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching published events:', error);
        return [];
      }

      return (data || []).map(convertSupabaseToAppEvent);
    } catch (error) {
      console.error('Error in getPublishedEvents:', error);
      return [];
    }
  }

  // Recherche d'événements
  async searchEvents(query: string): Promise<AppEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:promoter_id (id, name, avatar_url),
          tickets (id, name, price)
        `)
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching events:', error);
        return [];
      }

      return (data || []).map(convertSupabaseToAppEvent);
    } catch (error) {
      console.error('Error in searchEvents:', error);
      return [];
    }
  }
}

// Export du service
export const EventService = new SupabaseEventService();
