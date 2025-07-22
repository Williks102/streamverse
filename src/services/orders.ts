// src/services/orders.ts - Service de commandes avec types corrigés
import type { Order, NewOrderPayload } from '@/types';
import { EventService } from './events';

// This is a mock service. In a real application, this would interact with a database.
// For now, we will use an in-memory array that acts as a persistent store for the server's lifetime.
const ordersStore: Order[] = [];

async function getAllOrders(): Promise<Order[]> {
    return Promise.resolve([...ordersStore]);
}

async function getOrdersByUserId(userId: string): Promise<Order[]> {
    const userOrders = ordersStore.filter(o => o.userId === userId);
    // Sort by most recent first - utilise purchaseDate
    return userOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
}

async function createOrder(payload: NewOrderPayload): Promise<Order> {
    const { userId, eventId, ticketId } = payload;
    
    const event = await EventService.getEventById(eventId);
    if (!event) {
        throw new Error("Event not found for order creation.");
    }
    
    const ticket = event.tickets?.find(t => t.id === ticketId);
    if (!ticket) {
        throw new Error("Ticket not found for order creation.");
    }

    const now = new Date().toISOString();

    // ✅ Order avec purchaseDate ET createdAt pour compatibilité
    const newOrder: Order = {
        id: `order-${Date.now()}-${Math.random()}`,
        userId,
        eventId,
        ticketId,
        status: 'completed',
        purchaseDate: now, // ✅ Propriété principale
        createdAt: now,    // ✅ Alias pour compatibilité
        // Denormalize data for easier access on the frontend
        event,
        ticket,
    };

    ordersStore.unshift(newOrder); // Add to the beginning of the array
    
    console.log(`✅ Order created: ${newOrder.id} for user ${userId}`);
    console.log(`   - Event: ${event.title}`);
    console.log(`   - Ticket: ${ticket.name} (${ticket.price} XOF)`);
    console.log(`   - Purchase Date: ${newOrder.purchaseDate}`);
    
    return newOrder;
}

// ✅ Fonction pour obtenir les statistiques des commandes
async function getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: Record<string, number>;
    recentOrders: Order[];
}> {
    const allOrders = await getAllOrders();
    
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.ticket?.price || 0), 0);
    
    const ordersByStatus = allOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const recentOrders = allOrders
        .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
        .slice(0, 10);
    
    return {
        totalOrders,
        totalRevenue,
        ordersByStatus,
        recentOrders
    };
}

// ✅ Fonction pour obtenir les commandes par événement
async function getOrdersByEventId(eventId: string): Promise<Order[]> {
    const eventOrders = ordersStore.filter(o => o.eventId === eventId);
    return eventOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
}

// ✅ Fonction pour obtenir une commande par ID
async function getOrderById(orderId: string): Promise<Order | null> {
    const order = ordersStore.find(o => o.id === orderId);
    return order || null;
}

// ✅ Fonction pour marquer une commande comme annulée
async function cancelOrder(orderId: string): Promise<Order | null> {
    const orderIndex = ordersStore.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;
    
    ordersStore[orderIndex].status = 'cancelled';
    return ordersStore[orderIndex];
}

export const OrderService = {
    getAllOrders,
    getOrdersByUserId,
    createOrder,
    getOrderStats,
    getOrdersByEventId,
    getOrderById,
    cancelOrder,
};