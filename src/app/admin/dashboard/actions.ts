
'use server';

import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import type { AppEvent, Order } from '@/types';
import { OrderService } from '@/services/orders';

// In a real app, you would have a proper user service
const MOCK_USERS = [
    { id: 'user-123', email: 'user@example.com', name: 'Jean Dupont', role: 'user', totalSpent: 15000 },
    { id: 'promoter-1', email: 'contact@aiconf.inc', name: 'AI Conf Inc.', role: 'promoter', totalSpent: 0 },
    { id: 'promoter-2', email: 'hello@musicfest.group', name: 'MusicFest Group', role: 'promoter', totalSpent: 0 },
];

const MOCK_PAYOUT_REQUESTS = [
    { id: 'payout-1', promoterName: 'AI Conf Inc.', amount: 1250000, status: 'pending', requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'payout-2', promoterName: 'MusicFest Group', amount: 750000, status: 'pending', requestedAt: new Date().toISOString() },
];


export async function getAdminStats() {
    const allEvents = await EventService.getAllEvents();
    const allOrders = await OrderService.getAllOrders(); // Need to implement this in OrderService

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.ticket.price, 0);
    const totalTicketsSold = allOrders.length;

    return {
        totalEvents: allEvents.length,
        totalUsers: MOCK_USERS.length, // Simulated
        totalRevenue,
        totalTicketsSold
    };
}


export async function getAllEventsForAdmin(): Promise<AppEvent[]> {
    return EventService.getAllEvents();
}

export async function toggleEventPublishStatus(eventId: string) {
    await EventService.toggleEventPublished(eventId);
    revalidatePath('/admin/dashboard');
    revalidatePath('/promoter/dashboard'); // Also revalidate promoter dashboard
}

export async function deleteEvent(eventId: string) {
    await EventService.deleteEvent(eventId);
    revalidatePath('/admin/dashboard');
}

export async function getAllUsers() {
    // This is a mock function. In a real app, this would fetch from a user database.
    return Promise.resolve(MOCK_USERS);
}

export async function deleteUser(userId: string) {
    console.log(`(Simulation) Deleting user: ${userId}`);
    // In a real app, you would call your user service to delete the user.
    // For this mock, we don't actually mutate the MOCK_USERS array to keep it simple.
    revalidatePath('/admin/dashboard');
    return { success: true, message: 'Utilisateur supprimé (simulation).' };
}

export async function getSiteSettings() {
    // Mock settings
    return Promise.resolve({
        commissionRate: 20,
        siteName: 'StreamVerse',
        maintenanceMode: false,
    });
}

export async function updateSiteSettings(settings: { commissionRate: number, siteName: string, maintenanceMode: boolean }) {
    console.log('(Simulation) Updating site settings to:', settings);
     // In a real app, you'd save this to your database.
    revalidatePath('/admin/dashboard');
    return { success: true, message: 'Paramètres mis à jour (simulation).' };
}

export async function getPayoutRequests() {
    return Promise.resolve(MOCK_PAYOUT_REQUESTS);
}

export async function processPayout(payoutId: string, action: 'approve' | 'reject') {
    console.log(`(Simulation) Processing payout ${payoutId} with action: ${action}`);
    // In a real app, you'd update the database and initiate a transfer.
    revalidatePath('/admin/dashboard');
    return { success: true, message: `Paiement ${action === 'approve' ? 'approuvé' : 'rejeté'} (simulation).`};
}
