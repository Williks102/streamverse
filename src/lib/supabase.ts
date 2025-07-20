import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client typé avec nos types Database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export du type pour usage dans les composants
export type SupabaseClient = typeof supabase;