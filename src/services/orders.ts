
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
    // Sort by most recent first
    return userOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
}

async function createOrder(payload: NewOrderPayload): Promise<Order> {
    const { userId, eventId, ticketId } = payload;
    
    const event = await EventService.getEventById(eventId);
    if (!event) {
        throw new Error("Event not found for order creation.");
    }
    
    const ticket = event.tickets.find(t => t.id === ticketId);
    if (!ticket) {
        throw new Error("Ticket not found for order creation.");
    }

    const newOrder: Order = {
        id: `order-${Date.now()}-${Math.random()}`,
        userId,
        eventId,
        ticketId,
        purchaseDate: new Date().toISOString(),
        // Denormalize data for easier access on the frontend
        event,
        ticket,
    };

    ordersStore.unshift(newOrder); // Add to the beginning of the array
    
    console.log(`Order created: ${newOrder.id} for user ${userId}`);
    // console.log("Current Orders:", ordersStore);
    
    return newOrder;
}


export const OrderService = {
  getAllOrders,
  getOrdersByUserId,
  createOrder,
};
