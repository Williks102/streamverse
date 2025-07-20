import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TicketType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLowestPrice(tickets: TicketType[]): number {
  if (!tickets || tickets.length === 0) {
    return 0;
  }
  return tickets.reduce((min, ticket) => (ticket.price < min ? ticket.price : min), tickets[0].price);
}
