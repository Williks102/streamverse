// src/types/index.ts - Types Order corrigés
// Interface principale pour les événements
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

// ✅ Interface Order corrigée avec purchaseDate ET créatedAt pour compatibilité
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  ticketId: string;
  status: 'pending' | 'completed' | 'cancelled';
  purchaseDate: string; // ✅ Propriété principale pour la date d'achat
  createdAt: string;     // ✅ Alias pour compatibilité
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

// Types pour les constantes
export const EVENT_TYPES = ['live', 'vod', 'offline'] as const;
export const EVENT_STATUSES = ['live', 'upcoming', 'ended', 'recorded', 'scheduled', 'available'] as const;
export const USER_ROLES = ['user', 'promoter', 'admin'] as const;
export const VIDEO_QUALITIES = ['240p', '360p', '480p', '720p', '1080p', 'auto'] as const;

// Types utilitaires
export type EventType = typeof EVENT_TYPES[number];
export type EventStatus = typeof EVENT_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];

// Export par défaut pour compatibilité
export default AppEvent;