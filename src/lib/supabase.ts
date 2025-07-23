// src/lib/supabase.ts - Client unique et centralisé
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Validation des variables d'environnement
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL est requis');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY est requis');
}

// ✅ INSTANCE UNIQUE - Création d'un singleton
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

// ✅ Fonction pour obtenir l'instance unique
export function createClient() {
  // Si l'instance existe déjà, la retourner
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Créer l'instance une seule fois
  supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return supabaseInstance;
}

// ✅ Export de l'instance par défaut pour compatibilité
export const supabase = createClient();

// ✅ Export du type pour usage dans les composants
export type SupabaseClient = typeof supabase;

// ✅ Fonction pour créer un client server-side avec service role
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ✅ Helper pour reset l'instance (utile pour les tests)
export function resetSupabaseInstance() {
  supabaseInstance = null;
}