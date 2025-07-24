// src/types/index.ts - TYPES CORRIGÉS TYPESCRIPT
// ✅ Interface principale pour les événements avec tous les champs requis
export interface AppEvent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  'data-ai-hint': string;
  category: string;
  type: 'live' | 'vod' | 'offline';
  isPublished: boolean;
  status: 'live' | 'upcoming' | 'ended' | 'recorded' | 'scheduled' | 'available';
  // ✅ CORRECTION: Ajout de la propriété date qui était manquante
  date?: string | null;
  startTime?: string | null;
  duration?: string | null;
  videoSrc?: string | null;
  location?: string | null;
  address?: string | null;
  tickets?: Ticket[];
  transcript?: string;
  promoterInfo?: PromoterInfo | null;
}

// ✅ Interface unifiée pour les billets
export interface Ticket {
  id: string;
  name: string;
  price: number; // Prix en centimes (XOF)
  created_at?: string;
}

// ✅ Alias pour compatibilité avec l'ancien code
export type TicketType = Ticket;

// Interface pour les informations du promoteur
export interface PromoterInfo {
  id: string;
  name: string;
  avatarUrl: string;
}

// Interface pour les utilisateurs/profils
export interface UserProfile {
  id: string;
  name?: string | null;
  role: 'user' | 'promoter' | 'admin';
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ✅ Interface Order CORRIGÉE avec toutes les propriétés nécessaires
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  ticketId: string;
  status: 'pending' | 'completed' | 'cancelled';
  // ✅ CORRECTION: Ajout de purchaseDate ET createdAt pour compatibilité
  purchaseDate: string; // Propriété principale pour la date d'achat
  createdAt: string;     // Alias pour compatibilité
  // ✅ Relations optionnelles mais typées
  event?: AppEvent;
  ticket?: Ticket;
}

// ✅ Interface pour créer une nouvelle commande
export interface NewOrderPayload {
  userId: string;
  eventId: string;
  ticketId: string;
  email?: string;
}

// Types pour les formulaires de création/modification d'événements
export interface EventFormData {
  title: string;
  description: string;
  type: 'live' | 'vod' | 'offline';
  category: string;
  thumbnailUrl?: string;
  date?: string;
  startTime?: string;
  duration?: string;
  location?: string;
  address?: string;
  tickets?: Omit<Ticket, 'id'>[];
  isPublished?: boolean;
}

// Types pour les statistiques
export interface EventStats {
  total: number;
  published: number;
  live: number;
  vod: number;
  offline: number;
  byCategory: Record<string, number>;
}

// Types pour les filtres de recherche
export interface EventFilters {
  type?: 'live' | 'vod' | 'offline';
  category?: string;
  isPublished?: boolean;
  promoterId?: string;
  startDate?: string;
  endDate?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

// Types pour la pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les actions sur les événements
export type EventAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish';

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Types pour les analytics
export interface AnalyticsData {
  eventViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  revenue: number;
  topEvents: {
    id: string;
    title: string;
    views: number;
  }[];
}

// Types pour l'authentification
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'promoter' | 'admin';
  avatarUrl?: string;
  isEmailVerified: boolean;
}

// Types pour les erreurs
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// ✅ Types pour les players vidéo
export type VideoQuality = '240p' | '360p' | '480p' | '720p' | '1080p' | 'auto';
export type StreamType = 'mp4' | 'hls' | 'dash' | 'webrtc';
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'ended';

// ✅ Types pour les moyens de paiement
export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  isDefault: boolean;
  userId?: string;
}

// ✅ Types pour les statuts de commande avec union littérale
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// Types pour les constantes
export const EVENT_TYPES = ['live', 'vod', 'offline'] as const;
export const EVENT_STATUSES = ['live', 'upcoming', 'ended', 'recorded', 'scheduled', 'available'] as const;
export const USER_ROLES = ['user', 'promoter', 'admin'] as const;
export const ORDER_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export const VIDEO_QUALITIES = ['240p', '360p', '480p', '720p', '1080p', 'auto'] as const;

// Types utilitaires
export type EventType = typeof EVENT_TYPES[number];
export type EventStatus = typeof EVENT_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];

// ✅ CORRECTION des comparaisons de types - Utiliser les unions littérales
export function isValidOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status as OrderStatus);
}

export function isValidEventType(type: string): type is EventType {
  return EVENT_TYPES.includes(type as EventType);
}

export function isValidEventStatus(status: string): status is EventStatus {
  return EVENT_STATUSES.includes(status as EventStatus);
}

export function isValidUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

// ✅ Helper pour créer des objets Order typés
export function createOrder(data: {
  id: string;
  userId: string;
  eventId: string;
  ticketId: string;
  status: OrderStatus;
  event?: AppEvent;
  ticket?: Ticket;
}): Order {
  const now = new Date().toISOString();
  
  return {
    ...data,
    purchaseDate: now,
    createdAt: now,
  };
}

// ✅ Helper pour créer des objets AppEvent typés
export function createAppEvent(data: Omit<AppEvent, 'id'>): AppEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
  };
}

// Export par défaut pour compatibilité
export default AppEvent;