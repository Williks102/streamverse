
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';
import { OrderService } from '@/services/orders';

const MOCK_USER_ID = 'user-123'; // In a real app, get this from auth session

const checkoutSchema = z.object({
  email: z.string().email(),
  eventId: z.string(),
  ticketId: z.string(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export async function processCheckoutAction(values: CheckoutFormValues) {
    const event = await EventService.getEventById(values.eventId);
    if (!event) {
        throw new Error('Événement non trouvé.');
    }

    const ticket = event.tickets.find(t => t.id === values.ticketId);
    if (!ticket) {
        throw new Error('Billet non trouvé.');
    }

    try {
        await OrderService.createOrder({
            userId: MOCK_USER_ID,
            eventId: event.id,
            ticketId: ticket.id,
        });
        
        // Invalidate caches for pages that show user-specific data
        revalidatePath('/account');

        return { success: true, eventId: event.id };

    } catch (error) {
        console.error("Checkout failed:", error);
        throw new Error("Le traitement de votre commande a échoué. Veuillez réessayer.");
    }
}
