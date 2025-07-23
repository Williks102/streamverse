// src/app/events/[id]/checkout/actions.ts - VERSION COMPLÈTE AVEC AUTHENTIFICATION
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { EventService } from '@/services/events';
import { OrderService } from '@/services/orders';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// Schema pour checkout avec authentification
const checkoutWithAuthSchema = z.object({
  email: z.string().email(),
  eventId: z.string(),
  ticketId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
});

// Schema pour multi-checkout
const multiCheckoutSchema = z.object({
  email: z.string().email(),
  eventId: z.string(),
  tickets: z.array(z.object({
    ticketId: z.string(),
    quantity: z.number().min(1),
  })),
  userId: z.string(),
  userEmail: z.string().email(),
});

export type CheckoutWithAuthFormValues = z.infer<typeof checkoutWithAuthSchema>;
export type MultiCheckoutFormValues = z.infer<typeof multiCheckoutSchema>;

// Fonction helper pour obtenir le client Supabase côté serveur
async function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

// Fonction principale de checkout avec authentification
export async function processCheckoutActionWithAuth(values: CheckoutWithAuthFormValues) {
  try {
    console.log('🔄 [CHECKOUT] Début du processus pour:', values.userEmail);
    
    // 1. Créer le client Supabase et vérifier la session
    const supabase = await getSupabaseServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ [CHECKOUT] Session invalide:', sessionError);
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    // Vérifier que l'userId correspond à la session
    if (session.user.id !== values.userId) {
      console.error('❌ [CHECKOUT] UserId ne correspond pas à la session');
      throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
    }

    // 2. Vérifier le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', values.userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ [CHECKOUT] Profil utilisateur non trouvé:', profileError);
      throw new Error('Profil utilisateur introuvable.');
    }

    console.log('✅ [CHECKOUT] Utilisateur vérifié:', profile.name || values.userEmail);

    // 3. Vérifier que l'événement existe
    const event = await EventService.getEventById(values.eventId);
    if (!event) {
      throw new Error('Événement non trouvé.');
    }

    // 4. Vérifier que le ticket existe
    const ticket = event.tickets?.find(t => t.id === values.ticketId);
    if (!ticket) {
      throw new Error('Billet non trouvé.');
    }

    // 5. Vérifier si l'utilisateur a déjà acheté cet événement (pour les événements en ligne)
    if (event.type === 'live' || event.type === 'vod') {
      const existingPurchase = await checkExistingPurchase(values.userId, values.eventId);
      if (existingPurchase) {
        throw new Error('Vous avez déjà acheté l\'accès à cet événement.');
      }
    }

    // 6. Créer la commande
    const order = await OrderService.createOrder({
      userId: values.userId,
      eventId: event.id,
      ticketId: ticket.id,
    });

    console.log('✅ [CHECKOUT] Commande créée:', order.id);

    // 7. Envoyer un email de confirmation (simulé)
    await sendOrderConfirmationEmail({
      userEmail: values.email,
      userName: profile.name || 'Client',
      eventTitle: event.title,
      ticketName: ticket.name,
      ticketPrice: ticket.price,
      orderId: order.id,
    });
    
    // 8. Invalider les caches appropriés
    revalidatePath('/account');
    revalidatePath(`/events/${event.id}`);
    revalidatePath('/promoter/dashboard');

    console.log('✅ [CHECKOUT] Processus terminé avec succès');

    return { 
      success: true, 
      eventId: event.id,
      orderId: order.id 
    };

  } catch (error) {
    console.error("❌ [CHECKOUT] Échec:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Le traitement de votre commande a échoué. Veuillez réessayer."
    );
  }
}

// Fonction pour checkout multiple avec authentification
export async function processMultiCheckoutActionWithAuth(values: MultiCheckoutFormValues) {
  try {
    console.log('🔄 [MULTI-CHECKOUT] Début pour:', values.userEmail);
    
    // 1. Vérifier la session
    const supabase = await getSupabaseServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || session.user.id !== values.userId) {
      throw new Error('Session invalide. Veuillez vous reconnecter.');
    }

    // 2. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', values.userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profil utilisateur introuvable.');
    }

    console.log('✅ [MULTI-CHECKOUT] Utilisateur vérifié:', profile.name || values.userEmail);

    // 3. Vérifier l'événement
    const event = await EventService.getEventById(values.eventId);
    if (!event) {
      throw new Error('Événement non trouvé.');
    }

    // 4. Valider tous les tickets
    const validatedTickets = [];
    let totalAmount = 0;
    
    for (const ticketOrder of values.tickets) {
      const ticket = event.tickets?.find(t => t.id === ticketOrder.ticketId);
      if (!ticket) {
        throw new Error(`Billet ${ticketOrder.ticketId} non trouvé.`);
      }
      validatedTickets.push({ ticket, quantity: ticketOrder.quantity });
      totalAmount += ticket.price * ticketOrder.quantity;
    }

    // 5. Vérifier les contraintes selon le type d'événement
    if (event.type === 'live' || event.type === 'vod') {
      const totalQuantity = validatedTickets.reduce((sum, t) => sum + t.quantity, 0);
      if (totalQuantity > 1 || validatedTickets.length > 1) {
        throw new Error('Les événements en ligne sont limités à un seul accès par commande.');
      }
      
      // Vérifier l'achat existant
      const existingPurchase = await checkExistingPurchase(values.userId, values.eventId);
      if (existingPurchase) {
        throw new Error('Vous avez déjà acheté l\'accès à cet événement.');
      }
    }

    // 6. Créer les commandes
    const orders = [];
    for (const ticketOrder of validatedTickets) {
      for (let i = 0; i < ticketOrder.quantity; i++) {
        const order = await OrderService.createOrder({
          userId: values.userId,
          eventId: event.id,
          ticketId: ticketOrder.ticket.id,
        });
        orders.push(order);
      }
    }

    console.log(`✅ [MULTI-CHECKOUT] ${orders.length} commandes créées`);

    // 7. Envoyer l'email de confirmation
    await sendMultiOrderConfirmationEmail({
      userEmail: values.email,
      userName: profile.name || 'Client',
      eventTitle: event.title,
      tickets: validatedTickets,
      totalAmount,
      orderIds: orders.map(o => o.id),
    });
    
    // 8. Invalider les caches
    revalidatePath('/account');
    revalidatePath(`/events/${event.id}`);
    revalidatePath('/promoter/dashboard');

    return { 
      success: true, 
      eventId: event.id,
      totalOrders: orders.length,
      orderIds: orders.map(o => o.id)
    };

  } catch (error) {
    console.error("❌ [MULTI-CHECKOUT] Échec:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Le traitement de votre commande a échoué. Veuillez réessayer."
    );
  }
}

// Fonction pour vérifier si un utilisateur a déjà acheté un ticket
export async function checkExistingPurchase(userId: string, eventId: string): Promise<boolean> {
  try {
    const orders = await OrderService.getOrdersByUserId(userId);
    return orders.some(order => order.eventId === eventId && order.status === 'completed');
  } catch (error) {
    console.error('❌ [CHECK PURCHASE] Erreur:', error);
    return false;
  }
}

// Fonction pour obtenir les informations de l'utilisateur courant
export async function getCurrentUserFromSession() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email || '',
      profile: profile
    };
  } catch (error) {
    console.error('❌ [GET USER] Erreur:', error);
    return null;
  }
}

// Fonction simulée d'envoi d'email (à remplacer par un vrai service)
async function sendOrderConfirmationEmail(params: {
  userEmail: string;
  userName: string;
  eventTitle: string;
  ticketName: string;
  ticketPrice: number;
  orderId: string;
}) {
  console.log('📧 [EMAIL] Envoi confirmation à:', params.userEmail);
  // Dans une vraie app, utilisez un service comme SendGrid, Resend, etc.
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
}

// Fonction simulée d'envoi d'email pour commandes multiples
async function sendMultiOrderConfirmationEmail(params: {
  userEmail: string;
  userName: string;
  eventTitle: string;
  tickets: Array<{ ticket: any; quantity: number }>;
  totalAmount: number;
  orderIds: string[];
}) {
  console.log('📧 [EMAIL] Envoi confirmation multi-tickets à:', params.userEmail);
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
}

// Fonction pour valider l'accès à un événement payant
export async function validateEventAccess(eventId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const event = await EventService.getEventById(eventId);
    if (!event) return false;
    
    // Si l'événement est gratuit, accès autorisé
    const lowestPrice = Math.min(...(event.tickets?.map(t => t.price) || [0]));
    if (lowestPrice === 0) return true;
    
    // Sinon, vérifier l'achat
    return await checkExistingPurchase(userId, eventId);
  } catch (error) {
    console.error('❌ [VALIDATE ACCESS] Erreur:', error);
    return false;
  }
}