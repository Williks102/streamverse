// src/utils/orderUtils.ts - UTILITAIRES POUR LES STATUTS DE COMMANDE
import type { Order, OrderStatus } from '@/types';

// ✅ Constantes pour les statuts de commande
export const ORDER_STATUSES = {
  PENDING: 'pending' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
  CONFIRMED: 'confirmed' as const, // Alias pour completed
} as const;

// ✅ Type union pour tous les statuts valides
export type ValidOrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// ✅ Fonction pour vérifier si un statut est valide
export function isValidOrderStatus(status: string): status is OrderStatus {
  const validStatuses: string[] = Object.values(ORDER_STATUSES);
  return validStatuses.includes(status);
}

// ✅ Fonction pour vérifier si une commande est confirmée/complétée
export function isOrderConfirmed(order: Order): boolean {
  return order.status === 'completed' || order.status === 'confirmed';
}

// ✅ Fonction pour vérifier si une commande est en attente
export function isOrderPending(order: Order): boolean {
  return order.status === 'pending';
}

// ✅ Fonction pour vérifier si une commande est annulée
export function isOrderCancelled(order: Order): boolean {
  return order.status === 'cancelled';
}

// ✅ Fonction pour obtenir le libellé d'un statut en français
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'En attente',
    completed: 'Confirmé',
    cancelled: 'Annulé',
  };
  
  return labels[status] || status;
}

// ✅ Fonction pour obtenir la couleur d'un badge selon le statut
export function getOrderStatusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// ✅ Fonction pour filtrer les commandes par statut
export function filterOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
  return orders.filter(order => order.status === status);
}

// ✅ Fonction pour compter les commandes par statut
export function countOrdersByStatus(orders: Order[]): Record<OrderStatus, number> {
  return orders.reduce((acc, order) => {
    if (isValidOrderStatus(order.status)) {
      acc[order.status] = (acc[order.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<OrderStatus, number>);
}

// ✅ Fonction pour calculer le total des revenus des commandes confirmées
export function calculateConfirmedOrdersRevenue(orders: Order[]): number {
  return orders
    .filter(isOrderConfirmed)
    .reduce((total, order) => total + (order.ticket?.price || 0), 0);
}

// ✅ Fonction pour trier les commandes par date (plus récent en premier)
export function sortOrdersByDate(orders: Order[], ascending = false): Order[] {
  return [...orders].sort((a, b) => {
    const dateA = new Date(a.purchaseDate || a.createdAt);
    const dateB = new Date(b.purchaseDate || b.createdAt);
    
    return ascending 
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
}

// ✅ Fonction pour obtenir les commandes récentes (dernières 30 jours)
export function getRecentOrders(orders: Order[], days = 30): Order[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return orders.filter(order => {
    const orderDate = new Date(order.purchaseDate || order.createdAt);
    return orderDate >= cutoffDate;
  });
}

// ✅ Fonction pour formater la date d'une commande
export function formatOrderDate(order: Order, locale = 'fr-FR'): string {
  const date = new Date(order.purchaseDate || order.createdAt);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ✅ Export par défaut d'un objet avec toutes les fonctions utilitaires
export default {
  ORDER_STATUSES,
  isValidOrderStatus,
  isOrderConfirmed,
  isOrderPending,
  isOrderCancelled,
  getOrderStatusLabel,
  getOrderStatusVariant,
  filterOrdersByStatus,
  countOrdersByStatus,
  calculateConfirmedOrdersRevenue,
  sortOrdersByDate,
  getRecentOrders,
  formatOrderDate,
};