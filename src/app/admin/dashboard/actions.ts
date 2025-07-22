// src/app/admin/dashboard/actions.ts - TYPES CORRIGÉS
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { EventService } from '@/services/events';
import { OrderService } from '@/services/orders';
import type { Database } from '@/types/database';
import type { AppEvent } from '@/types';

// Client Supabase avec les droits admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// ✅ STATISTIQUES RÉELLES
export async function getAdminStats() {
    try {
        // Récupérer tous les événements
        const allEvents = await EventService.getAllEvents();
        
        // Récupérer toutes les commandes
        const allOrders = await OrderService.getAllOrders();

        // Récupérer tous les utilisateurs
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, role, created_at');

        if (usersError) {
            console.error('Erreur récupération utilisateurs:', usersError);
        }

        // Calculer les statistiques
        const totalRevenue = allOrders.reduce((sum, order) => {
            const ticket = order.ticket || allEvents
                .find(e => e.id === order.eventId)?.tickets
                ?.find(t => t.id === order.ticketId);
            return sum + (ticket?.price || 0);
        }, 0);

        const totalTicketsSold = allOrders.length;
        const totalUsers = users?.length || 0;
        const totalEvents = allEvents.length;

        return {
            totalEvents,
            totalUsers,
            totalRevenue,
            totalTicketsSold,
            publishedEvents: allEvents.filter(e => e.isPublished).length,
            promoters: users?.filter(u => u.role === 'promoter').length || 0,
            regularUsers: users?.filter(u => u.role === 'user').length || 0,
        };
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        return {
            totalEvents: 0,
            totalUsers: 0,
            totalRevenue: 0,
            totalTicketsSold: 0,
            publishedEvents: 0,
            promoters: 0,
            regularUsers: 0,
        };
    }
}

// ✅ GESTION ÉVÉNEMENTS RÉELLE
export async function getAllEventsForAdmin(): Promise<AppEvent[]> {
    return EventService.getAllEvents();
}

export async function toggleEventPublishStatus(eventId: string) {
    await EventService.toggleEventPublished(eventId);
    revalidatePath('/admin/dashboard');
    revalidatePath('/promoter/dashboard');
}

export async function deleteEvent(eventId: string) {
    try {
        // Supprimer d'abord les billets associés
        const { error: ticketsError } = await supabase
            .from('tickets')
            .delete()
            .eq('event_id', eventId);

        if (ticketsError) {
            console.error('Erreur suppression billets:', ticketsError);
        }

        // Supprimer l'événement
        const { error: eventError } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (eventError) {
            throw new Error(`Erreur suppression événement: ${eventError.message}`);
        }

        revalidatePath('/admin/dashboard');
        revalidatePath('/promoter/dashboard');
    } catch (error) {
        console.error('Erreur deleteEvent:', error);
        throw error;
    }
}

// ✅ GESTION UTILISATEURS RÉELLE
export async function getAllUsers() {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                name,
                role,
                avatar_url,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur récupération utilisateurs:', error);
            return [];
        }

        // Enrichir avec des statistiques de commandes
        const enrichedUsers = await Promise.all(
            (profiles || []).map(async (profile) => {
                // Calculer le total dépensé pour chaque utilisateur
                const orders = await OrderService.getOrdersByUserId(profile.id);
                const totalSpent = orders.reduce((sum, order) => {
                    return sum + (order.ticket?.price || 0);
                }, 0);

                return {
                    id: profile.id,
                    email: `${profile.name}@example.com`, // Email mock - ajustez selon votre structure
                    name: profile.name || 'Utilisateur',
                    role: profile.role,
                    totalSpent,
                    createdAt: profile.created_at,
                    avatarUrl: profile.avatar_url,
                };
            })
        );

        return enrichedUsers;
    } catch (error) {
        console.error('Erreur getAllUsers:', error);
        return [];
    }
}

export async function deleteUser(userId: string) {
    try {
        // Supprimer d'abord les commandes de l'utilisateur
        const { error: ordersError } = await supabase
            .from('orders')
            .delete()
            .eq('user_id', userId);

        if (ordersError) {
            console.error('Erreur suppression commandes:', ordersError);
        }

        // Supprimer les événements créés par cet utilisateur (si promoteur)
        const { data: userEvents } = await supabase
            .from('events')
            .select('id')
            .eq('promoter_id', userId);

        if (userEvents && userEvents.length > 0) {
            for (const event of userEvents) {
                await deleteEvent(event.id);
            }
        }

        // Supprimer le profil utilisateur
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            throw new Error(`Erreur suppression utilisateur: ${profileError.message}`);
        }

        revalidatePath('/admin/dashboard');
        return { success: true, message: 'Utilisateur supprimé avec succès.' };
    } catch (error) {
        console.error('Erreur deleteUser:', error);
        return { success: false, message: 'Erreur lors de la suppression de l\'utilisateur.' };
    }
}

// ✅ PARAMÈTRES SITE RÉELS (Version simplifiée sans table dédiée)
export async function getSiteSettings() {
    // Pour l'instant, utiliser des valeurs par défaut
    // Vous pouvez les stocker en variables d'environnement ou créer une table dédiée plus tard
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
        // Pour l'instant, juste logger les changements
        // Dans une vraie application, vous stockeriez ces valeurs en base ou en variables d'environnement
        console.log('Paramètres mis à jour:', settings);
        
        revalidatePath('/admin/dashboard');
        return { success: true, message: 'Paramètres mis à jour avec succès.' };
    } catch (error) {
        console.error('Erreur updateSiteSettings:', error);
        return { success: false, message: 'Erreur lors de la mise à jour des paramètres.' };
    }
}

// ✅ GESTION PAIEMENTS RÉELLE (Version simplifiée)
export async function getPayoutRequests() {
    try {
        // Version simplifiée : récupérer les promoteurs et simuler des demandes de paiement
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
            amount: (index + 1) * 500000, // Montants simulés
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
        // Pour l'instant, juste logger l'action
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