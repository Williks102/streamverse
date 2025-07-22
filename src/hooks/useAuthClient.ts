// src/hooks/useAuthClient.ts - VERSION CORRIGÉE AVEC DEBUG
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

  // ✅ Fonction pour récupérer le profil utilisateur
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📡 [FETCH PROFILE] Récupération profil pour:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [FETCH PROFILE] Erreur:', error);
        
        // Si le profil n'existe pas, essayer de le créer
        if (error.code === 'PGRST116') {
          console.log('🔧 [CREATE PROFILE] Profil inexistant, création...');
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newProfile = {
              id: user.id,
              name: user.email?.split('@')[0] || 'Utilisateur',
              role: 'promoter' as const,
              avatar_url: null,
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error('❌ [CREATE PROFILE] Erreur création:', createError);
              return null;
            }

            console.log('✅ [CREATE PROFILE] Profil créé:', createdProfile);
            return createdProfile;
          }
        }
        return null;
      }

      console.log('✅ [FETCH PROFILE] Profil récupéré:', profile);
      return profile;
    } catch (error) {
      console.error('❌ [FETCH PROFILE] Exception:', error);
      return null;
    }
  };

  // ✅ Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [SIGN IN] Tentative connexion:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [SIGN IN] Erreur:', error);
        return { error };
      }

      console.log('✅ [SIGN IN] Connexion réussie:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('❌ [SIGN IN] Exception:', error);
      return { error: error as Error };
    }
  };

  // ✅ Fonction de déconnexion
  const signOut = async () => {
    try {
      console.log('🚪 [SIGN OUT] Déconnexion...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ [SIGN OUT] Erreur:', error);
    }
  };

  // ✅ Récupérer les informations utilisateur pour les Server Actions
  const getUserInfoForServerAction = () => {
    console.log('📋 [GET USER INFO] État actuel:', {
      userExists: !!state.user,
      profileExists: !!state.profile,
      isAuthenticated: state.isAuthenticated,
      isPromoter: state.isPromoter,
      userId: state.user?.id,
      profileId: state.profile?.id,
      profileRole: state.profile?.role
    });

    if (!state.user) {
      console.error('❌ [GET USER INFO] Utilisateur non trouvé');
      throw new Error('Utilisateur non authentifié - user manquant');
    }

    if (!state.profile) {
      console.error('❌ [GET USER INFO] Profil non trouvé');
      throw new Error('Utilisateur non authentifié - profil manquant');
    }

    const userInfo = {
      id: state.user.id,
      email: state.user.email || '',
      profileId: state.profile.id,
      profileName: state.profile.name || '',
      profileRole: state.profile.role,
      avatarUrl: state.profile.avatar_url || undefined,
    };

    console.log('✅ [GET USER INFO] Infos utilisateur préparées:', userInfo);
    return userInfo;
  };

  // ✅ Tester l'authentification
  const testAuth = async () => {
    try {
      console.log('🧪 [CLIENT AUTH TEST] Début du test...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🧪 [CLIENT AUTH TEST] User:', user?.email, 'Error:', userError);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🧪 [CLIENT AUTH TEST] Session:', !!session, 'Error:', sessionError);

      console.log('🧪 [CLIENT AUTH TEST] État actuel:', {
        isAuthenticated: state.isAuthenticated,
        isPromoter: state.isPromoter,
        profileExists: !!state.profile,
        userExists: !!state.user
      });

      if (state.profile) {
        console.log('🧪 [CLIENT AUTH TEST] Profile:', {
          id: state.profile.id,
          role: state.profile.role,
          name: state.profile.name
        });
      }

      return {
        success: !!user && !!state.profile && state.isAuthenticated,
        user: user ? { id: user.id, email: user.email } : null,
        profile: state.profile,
        session: !!session,
        error: userError?.message || sessionError?.message || null
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

  // ✅ Initialisation et écoute des changements d'authentification
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 [INIT AUTH] Initialisation...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [INIT AUTH] Erreur récupération session:', error);
          if (mounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('👤 [INIT AUTH] Session trouvée pour:', session.user.email);
          
          const profile = await fetchProfile(session.user.id);
          
          if (profile) {
            setState({
              user: session.user,
              profile: profile,
              session: session,
              isLoading: false,
              isAuthenticated: true,
              isPromoter: profile.role === 'promoter',
            });
            console.log('✅ [INIT AUTH] État mis à jour:', {
              userId: session.user.id,
              profileRole: profile.role,
              isPromoter: profile.role === 'promoter'
            });
          } else {
            console.log('❌ [INIT AUTH] Impossible de récupérer/créer le profil');
            setState(prev => ({ ...prev, isLoading: false }));
          }
        } else if (mounted) {
          console.log('🚫 [INIT AUTH] Aucune session trouvée');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('❌ [INIT AUTH] Exception:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH STATE CHANGE] Événement:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('📥 [AUTH STATE CHANGE] Connexion détectée:', session.user.email);
          
          const profile = await fetchProfile(session.user.id);
          
          if (profile) {
            setState({
              user: session.user,
              profile: profile,
              session: session,
              isLoading: false,
              isAuthenticated: true,
              isPromoter: profile.role === 'promoter',
            });
            
            toast({
              title: "Connexion réussie",
              description: `Bienvenue ${session.user.email}`
            });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('📤 [AUTH STATE CHANGE] Déconnexion détectée');
          setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isPromoter: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 [AUTH STATE CHANGE] Token rafraîchi');
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
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    ...state,
    signIn,
    signOut,
    testAuth,
    getUserInfoForServerAction,
    supabase,
  };
}