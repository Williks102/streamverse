// src/lib/supabase.ts - Client Supabase corrigé avec exports
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Client par défaut typé avec nos types Database
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

// ✅ Fonction createClient exportée pour usage direct
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export du type pour usage dans les composants
export type SupabaseClient = typeof supabase;

// ✅ Helper pour créer un client avec des options personnalisées
export function createClientWithOptions(options?: any) {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, options);
}