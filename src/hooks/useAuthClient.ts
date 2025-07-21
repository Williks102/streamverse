// src/hooks/useAuthClient.ts - Hook d'authentification côté client
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string | null;
  role: 'user' | 'promoter' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPromoter: boolean;
}

// Client Supabase côté client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export function useAuthClient() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isPromoter: false,
  });

  const router = useRouter();
  const { toast } = useToast();

  // ✅ Récupérer les informations utilisateur pour les Server Actions
  const getUserInfoForServerAction = () => {
    if (!state.user || !state.profile) {
      throw new Error('Utilisateur non authentifié');
    }

    return {
      id: state.user.id,
      email: state.user.email || '',
      profileId: state.profile.id,
      profileName: state.profile.name || '',
      profileRole: state.profile.role,
      avatarUrl: state.profile.avatar_url || undefined,
    };
  };

  // ✅ Tester l'authentification
  const testAuth = async () => {
    try {
      console.log('🧪 [CLIENT AUTH TEST] Début du test...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🧪 [CLIENT AUTH TEST] User:', user?.email, 'Error:', userError);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🧪 [CLIENT AUTH TEST] Session:', !!session, 'Error:', sessionError);

      if (state.profile) {
        console.log('🧪 [CLIENT AUTH TEST] Profile:', {
          id: state.profile.id,
          role: state.profile.role,
          name: state.profile.name
        });
      }

      return {
        success: !!user && !!state.profile,
        user: user ? { id: user.id, email: user.email } : null,
        profile: state.profile,
        session: !!session,
        error: userError?.message || sessionError?.message
      };
    } catch (error) {
      console.error('🧪 [CLIENT AUTH TEST ERROR]:', error);
      return {
        success: false,
        user: null,
        profile: null,
        session: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  // ✅ Connexion
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }

    return { error: null };
  };

  // ✅ Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isPromoter: false,
    });
    router.push('/');
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté" });
  };

  // ✅ Récupérer le profil utilisateur
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur fetchProfile:', error);
      return null;
    }
  };

  // ✅ Initialisation et écoute des changements d'authentification
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur récupération session:', error);
          return;
        }

        if (mounted && session?.user) {
          const profile = await fetchProfile(session.user.id);
          
          setState({
            user: session.user,
            profile: profile,
            session: session,
            isLoading: false,
            isAuthenticated: true,
            isPromoter: profile?.role === 'promoter',
          });
        } else if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile: profile,
            session: session,
            isLoading: false,
            isAuthenticated: true,
            isPromoter: profile?.role === 'promoter',
          });
          
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${session.user.email}`
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isPromoter: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            user: session.user,
            session: session
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe(); // ✅ Correction : pas de .subscription.unsubscribe()
    };
  }, [toast]);

  return {
    ...state,
    signIn,
    signOut,
    testAuth,
    getUserInfoForServerAction,
    supabase, // Export du client pour usage direct si nécessaire
  };
}