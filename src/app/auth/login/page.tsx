// ===================================================
// 📁 src/app/auth/login/page.tsx
// ===================================================

'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/promoter/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        if (session) {
          // Vérifier/créer le profil utilisateur
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!profile) {
            // Créer le profil s'il n'existe pas
            await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'Utilisateur',
                role: 'promoter', // Par défaut promoteur pour votre app
                avatar_url: 'https://placehold.co/40x40.png'
              })
          }

          router.push('/promoter/dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">
            StreamVerse
          </CardTitle>
          <CardDescription className="text-lg">
            Connexion Promoteur
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour gérer vos événements
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  }
                }
              }
            }}
            providers={[]} // Seulement email/password pour l'instant
            redirectTo={`${location.origin}/auth/callback`}
            onlyThirdPartyProviders={false}
            magicLink={false}
            view="sign_in"
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion...',
                  link_text: 'Vous avez déjà un compte ? Connectez-vous'
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'S\'inscrire',
                  loading_button_label: 'Inscription...',
                  link_text: 'Pas de compte ? Inscrivez-vous'
                }
              }
            }}
          />
          
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>Utilisateur test :</p>
            <p className="font-mono">promoter@aiconf.inc</p>
            <p className="font-mono">password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}