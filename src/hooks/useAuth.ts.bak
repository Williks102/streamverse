// ===================================================
// 📁 src/hooks/useAuth.ts
// ===================================================

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string | null
  role: 'user' | 'promoter' | 'admin'
  avatar_url: string | null
}

interface UseAuthReturn {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const refreshProfile = async () => {
    if (!user) return

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Erreur profil:', error)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erreur lors de la déconnexion:', error)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await refreshProfile()
        }
      } catch (error) {
        console.error('Erreur session initiale:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await refreshProfile()
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, user?.id])

  // Effet séparé pour refreshProfile quand user change
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
  }, [user])

  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }
}