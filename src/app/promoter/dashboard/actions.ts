
'use server';

import { revalidatePath } from 'next/cache';
import { EventService } from '@/services/events';

export async function togglePublishAction(eventId: string) {
    try {
        await EventService.toggleEventPublished(eventId);
        console.log('Event publish state toggled:', eventId);

        revalidatePath('/promoter/dashboard');
    } catch (error) {
        console.error("Error in togglePublishAction:", error);
        throw new Error("Échec de la modification du statut de publication.");
    }
}
