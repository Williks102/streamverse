// src/lib/utils.ts - CORRIGÉ POUR UTILISER LE BON TYPE
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Ticket } from "@/types"; // ✅ Utiliser Ticket au lieu de TicketType

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ CORRIGÉ : Utiliser Ticket[] au lieu de TicketType[]
export function getLowestPrice(tickets: Ticket[]): number {
  if (!tickets || tickets.length === 0) {
    return 0;
  }
  return tickets.reduce((min, ticket) => (ticket.price < min ? ticket.price : min), tickets[0].price);
}