import type { AppEvent } from '@/types';
import { EventService } from '@/services/events';

// ✅ Ces fonctions sont déjà correctes
export const getPublishedEvents = async (): Promise<AppEvent[]> => {
  return await EventService.getPublishedEvents();
};

export const getEventById = async (id: string): Promise<AppEvent | undefined> => {
  return await EventService.getEventById(id);
};

export const getEventsByPromoterId = async (promoterId: string): Promise<AppEvent[]> => {
  return await EventService.getEventsByPromoterId(promoterId);
};

export const getAllEvents = async (): Promise<AppEvent[]> => {
  return await EventService.getAllEvents();
};

export const searchEvents = async (query: string): Promise<AppEvent[]> => {
  return await EventService.searchEvents(query);
};