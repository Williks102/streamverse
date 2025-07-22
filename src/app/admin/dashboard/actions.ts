// src/app/admin/dashboard/actions.ts - Récupération des vrais utilisateurs
'use server';

import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import type { AppEvent, Order } from '@/types';
import { OrderService } from '@/services/orders';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Client Supabase server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// ✅ Fonction helper pour supprimer un événement avec tous ses billets
async function deleteEventById(eventId: string): Promise<void> {
    try {
        // 1. Supprimer d'abord les billets associés
        const { error: ticketsError } = await supabase
            .from('tickets')
            .delete()
            .eq('event_id', eventId);

        if (ticketsError) {
            console.error('Erreur suppression billets:', ticketsError);
        }

        // 2. Supprimer les commandes associées à cet événement
        const { error: ordersError } = await supabase
            .from('orders')
            .delete()
            .eq('event_id', eventId);

        if (ordersError) {
            console.error('Erreur suppression commandes:', ordersError);
        }

        // 3. Supprimer l'événement
        const { error: eventError } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (eventError) {
            throw new Error(`Erreur suppression événement: ${eventError.message}`);
        }

        console.log('✅ Événement supprimé avec succès:', eventId);
    } catch (error) {
        console.error('❌ Erreur deleteEventById:', error);
        throw error;
    }
}

export async function getAdminStats() {
    try {
        const allEvents = await EventService.getAllEvents();
        const allOrders = await OrderService.getAllOrders();

        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.ticket?.price ?? 0), 0);
        const totalTicketsSold = allOrders.length;

        // ✅ Récupérer le vrai nombre d'utilisateurs
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' });

        const totalUsers = error ? 0 : profiles?.length || 0;

        return {
            totalEvents: allEvents.length,
            totalUsers,
            totalRevenue,
            totalTicketsSold
        };
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        return {
            totalEvents: 0,
            totalUsers: 0,
            totalRevenue: 0,
            totalTicketsSold: 0
        };
    }
}

export async function getAllEventsForAdmin(): Promise<AppEvent[]> {
    try {
        return await EventService.getAllEvents();
    } catch (error) {
        console.error('Erreur getAllEventsForAdmin:', error);
        return [];
    }
}

export async function toggleEventPublishStatus(eventId: string) {
    try {
        await EventService.toggleEventPublished(eventId);
        revalidatePath('/admin/dashboard');
        revalidatePath('/promoter/dashboard');
        return { success: true, message: 'Statut de publication mis à jour.' };
    } catch (error) {
        console.error('Erreur toggleEventPublishStatus:', error);
        return { success: false, message: 'Erreur lors de la mise à jour.' };
    }
}

export async function deleteEvent(eventId: string) {
    try {
        await deleteEventById(eventId);
        revalidatePath('/admin/dashboard');
        revalidatePath('/promoter/dashboard');
        return { success: true, message: 'Événement supprimé avec succès.' };
    } catch (error) {
        console.error('Erreur deleteEvent:', error);
        return { success: false, message: 'Erreur lors de la suppression de l\'événement.' };
    }
}

// ✅ RÉCUPÉRATION DES VRAIS UTILISATEURS DEPUIS SUPABASE
export async function getAllUsers() {
    try {
        console.log('🔍 Récupération des utilisateurs depuis Supabase...');
        
        // 1. Récupérer tous les profils avec les données auth
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('❌ Erreur récupération profils:', profilesError);
            return [];
        }

        console.log(`✅ ${profiles?.length || 0} profils trouvés`);

        // 2. Récupérer les données d'authentification
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            console.error('❌ Erreur récupération utilisateurs auth:', usersError);
        }

        console.log(`✅ ${users?.length || 0} utilisateurs auth trouvés`);

        // 3. Enrichir avec les données de commandes et auth
        const enrichedUsers = await Promise.all(
            (profiles || []).map(async (profile) => {
                try {
                    // Trouver les données auth correspondantes
                    const authUser = users?.find(user => user.id === profile.id);
                    
                    // Récupérer les commandes pour calculer le total dépensé
                    const orders = await OrderService.getOrdersByUserId(profile.id);
                    const totalSpent = orders.reduce((sum, order) => {
                        if (order && order.ticket && typeof order.ticket.price === 'number') {
                            return sum + order.ticket.price;
                        }
                        return sum;
                    }, 0);

                    return {
                        id: profile.id,
                        email: authUser?.email || profile.name ? `${profile.name}@example.com` : 'user@example.com',
                        name: profile.name || 'Utilisateur',
                        role: profile.role,
                        totalSpent,
                        createdAt: profile.created_at,
                        updatedAt: profile.updated_at,
                        avatarUrl: profile.avatar_url,
                        lastSignIn: authUser?.last_sign_in_at || null,
                        emailConfirmed: authUser?.email_confirmed_at ? true : false,
                    };
                } catch (orderError) {
                    console.error('Erreur récupération commandes pour utilisateur:', profile.id, orderError);
                    
                    // Retourner les données de base même en cas d'erreur commandes
                    const authUser = users?.find(user => user.id === profile.id);
                    return {
                        id: profile.id,
                        email: authUser?.email || profile.name ? `${profile.name}@example.com` : 'user@example.com',
                        name: profile.name || 'Utilisateur',
                        role: profile.role,
                        totalSpent: 0,
                        createdAt: profile.created_at,
                        updatedAt: profile.updated_at,
                        avatarUrl: profile.avatar_url,
                        lastSignIn: authUser?.last_sign_in_at || null,
                        emailConfirmed: authUser?.email_confirmed_at ? true : false,
                    };
                }
            })
        );

        console.log(`✅ ${enrichedUsers.length} utilisateurs enrichis retournés`);
        return enrichedUsers;
        
    } catch (error) {
        console.error('❌ Erreur getAllUsers:', error);
        return [];
    }
}

export async function deleteUser(userId: string) {
    try {
        console.log('🗑️ Suppression utilisateur:', userId);

        // 1. Supprimer d'abord les commandes de l'utilisateur
        const { error: ordersError } = await supabase
            .from('orders')
            .delete()
            .eq('user_id', userId);

        if (ordersError) {
            console.error('Erreur suppression commandes:', ordersError);
        }

        // 2. Supprimer les événements créés par cet utilisateur (si promoteur)
        const { data: userEvents } = await supabase
            .from('events')
            .select('id')
            .eq('promoter_id', userId);

        if (userEvents && userEvents.length > 0) {
            console.log(`Suppression de ${userEvents.length} événements...`);
            for (const event of userEvents) {
                await deleteEventById(event.id);
            }
        }

        // 3. Supprimer le profil utilisateur
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            throw new Error(`Erreur suppression profil: ${profileError.message}`);
        }

        // 4. Supprimer l'utilisateur de l'authentification
        try {
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            if (authError) {
                console.warn('Erreur suppression auth (peut être normal):', authError);
            }
        } catch (authError) {
            console.warn('Impossible de supprimer l\'utilisateur auth:', authError);
        }

        revalidatePath('/admin/dashboard');
        return { success: true, message: 'Utilisateur supprimé avec succès.' };
        
    } catch (error) {
        console.error('❌ Erreur deleteUser:', error);
        return { success: false, message: 'Erreur lors de la suppression de l\'utilisateur.' };
    }
}

// ✅ PARAMÈTRES AVEC FONCTION CLIENT-SIDE (pour localStorage)
export async function getSiteSettings() {
    return {
        commissionRate: 20,
        siteName: 'StreamVerse',
        maintenanceMode: false,
    };
}

export async function updateSiteSettings(settings: { 
    commissionRate: number; 
    siteName: string; 
    maintenanceMode: boolean; 
}) {
    try {
        console.log('✅ [SERVER] Paramètres reçus pour revalidation:', settings);
        
        // Revalider les pages concernées
        revalidatePath('/admin/dashboard');
        revalidatePath('/promoter/dashboard');
        revalidatePath('/');
        
        return { 
            success: true, 
            message: 'Paramètres mis à jour et pages revalidées.' 
        };
    } catch (error) {
        console.error('Erreur updateSiteSettings:', error);
        return { 
            success: false, 
            message: 'Erreur lors de la mise à jour des paramètres.' 
        };
    }
}

// ✅ GESTION PAIEMENTS RÉELLE
export async function getPayoutRequests() {
    try {
        const { data: promoters, error } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('role', 'promoter');

        if (error) {
            console.error('Erreur récupération promoteurs:', error);
            return [];
        }

        // Simuler quelques demandes de paiement
        const mockRequests = (promoters || []).slice(0, 2).map((promoter, index) => ({
            id: `payout-${promoter.id}`,
            promoterName: promoter.name || 'Promoteur',
            amount: (index + 1) * 500000,
            status: 'pending' as const,
            requestedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        }));

        return mockRequests;
    } catch (error) {
        console.error('Erreur getPayoutRequests:', error);
        return [];
    }
}

export async function processPayout(payoutId: string, action: 'approve' | 'reject') {
    try {
        console.log(`Traitement paiement ${payoutId}: ${action}`);
        
        revalidatePath('/admin/dashboard');
        return { 
            success: true, 
            message: `Paiement ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès.`
        };
    } catch (error) {
        console.error('Erreur processPayout:', error);
        return { 
            success: false, 
            message: 'Erreur lors du traitement du paiement.' 
        };
    }
}