// ===================================================
// 📁 src/app/auth/callback/route.ts
// ===================================================

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
      console.log('✅ Session créée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code:', error)
      return NextResponse.redirect(requestUrl.origin + '/auth/login?error=auth_failed')
    }
  }

  // Rediriger vers le dashboard après connexion réussie
  return NextResponse.redirect(requestUrl.origin + '/promoter/dashboard')
}