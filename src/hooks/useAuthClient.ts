// src/hooks/useAuthClient.ts - Hook d'authentification corrigé
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
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
  const supabase = createClient();

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
              role: 'user' as const, // Par défaut 'user' au lieu de 'promoter'
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

  // ✅ Fonction de connexion - sans refreshProfile
  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('✅ [SIGN IN] Utilisateur connecté:', data.user.email);
        
        // Récupérer le profil
        const profile = await fetchProfile(data.user.id);
        
        setState({
          user: data.user,
          profile,
          session: data.session,
          isLoading: false,
          isAuthenticated: true,
          isPromoter: profile?.role === 'promoter' || profile?.role === 'admin',
        });

        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.email}`,
        });

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('❌ [SIGN IN] Erreur:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter",
        variant: "destructive"
      });

      return false;
    }
  };

  // ✅ Fonction d'inscription - sans refreshProfile
  const signUp = async (credentials: { email: string; password: string; name?: string }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name || credentials.email.split('@')[0],
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ [SIGN UP] Utilisateur créé:', data.user?.email);
      
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte",
      });

      return true;
    } catch (error: any) {
      console.error('❌ [SIGN UP] Erreur:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive"
      });

      return false;
    }
  };

  // ✅ Fonction de déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPromoter: false,
      });

      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });

      router.push('/');
    } catch (error: any) {
      console.error('❌ [SIGN OUT] Erreur:', error);
      
      toast({
        title: "Erreur de déconnexion",
        description: error.message || "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  // ✅ Fonction pour recharger le profil manuellement
  const refreshUserProfile = async () => {
    if (!state.user) return;
    
    try {
      const profile = await fetchProfile(state.user.id);
      setState(prev => ({
        ...prev,
        profile,
        isPromoter: profile?.role === 'promoter' || profile?.role === 'admin',
      }));
    } catch (error) {
      console.error('❌ [REFRESH PROFILE] Erreur:', error);
    }
  };

  // Initialiser l'état de l'authentification
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Récupérer la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [INIT AUTH] Erreur session:', error);
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (session?.user) {
          console.log('✅ [INIT AUTH] Session existante trouvée:', session.user.email);
          
          const profile = await fetchProfile(session.user.id);
          
          if (isMounted) {
            setState({
              user: session.user,
              profile,
              session,
              isLoading: false,
              isAuthenticated: true,
              isPromoter: profile?.role === 'promoter' || profile?.role === 'admin',
            });
          }
        } else {
          console.log('ℹ️ [INIT AUTH] Aucune session trouvée');
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('❌ [INIT AUTH] Exception:', error);
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AUTH CHANGE]', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          
          if (isMounted) {
            setState({
              user: session.user,
              profile,
              session,
              isLoading: false,
              isAuthenticated: true,
              isPromoter: profile?.role === 'promoter' || profile?.role === 'admin',
            });
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setState({
              user: null,
              profile: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              isPromoter: false,
            });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshUserProfile, // ✅ Remplace refreshProfile
  };
}