// src/middleware.ts - VERSION CORRIGÉE POUR ÉVITER LES ERREURS 403
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // ✅ CORRECTION CRITIQUE : Exclure explicitement les fichiers statiques
  const pathname = req.nextUrl.pathname;
  
  // ✅ Ne pas traiter les fichiers statiques Next.js
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') && !pathname.includes('/auth/')  // Fichiers avec extension (sauf routes auth)
  ) {
    console.log('🔓 [MIDDLEWARE] Fichier statique autorisé:', pathname);
    return res;
  }

  // ✅ Éviter le traitement des routes d'authentification
  const authRoutes = ['/auth/login', '/auth/register', '/auth/callback'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute) {
    console.log('🔓 [MIDDLEWARE] Route d\'authentification autorisée:', pathname);
    return res;
  }

  // ✅ Éviter le traitement des pages publiques
  const publicRoutes = ['/', '/events', '/about', '/contact'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/events/');
  
  if (isPublicRoute) {
    console.log('🔓 [MIDDLEWARE] Route publique autorisée:', pathname);
    return res;
  }

  // ✅ Traitement de l'authentification seulement pour les routes protégées
  try {
    const supabase = createMiddlewareClient({ req, res });

    // Rafraîchir la session si elle existe
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ [MIDDLEWARE] Erreur session:', sessionError);
      // En cas d'erreur de session, laisser passer pour éviter les boucles
      return res;
    }

    // Routes protégées qui nécessitent une authentification
    const protectedRoutes = [
      '/events/*/checkout',
      '/account',
      '/promoter/*',
      '/admin/*',
    ];

    // Routes qui nécessitent un rôle spécifique
    const roleProtectedRoutes = {
      '/promoter/*': ['promoter', 'admin'],
      '/admin/*': ['admin'],
    };

    // Vérifier si la route actuelle est protégée
    const isProtectedRoute = protectedRoutes.some(route => {
      const pattern = route.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(pathname);
    });

    if (isProtectedRoute && !session) {
      console.log('🔒 [MIDDLEWARE] Route protégée accédée sans authentification:', pathname);
      
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      
      // ✅ Ajouter returnUrl SEULEMENT si ce n'est pas déjà une route d'auth
      if (!pathname.startsWith('/auth/')) {
        redirectUrl.searchParams.set('returnUrl', pathname);
      }
      
      console.log('🔄 [MIDDLEWARE] Redirection vers:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }

    // Vérifier les rôles pour les routes spécifiques
    if (session?.user) {
      for (const [routePattern, allowedRoles] of Object.entries(roleProtectedRoutes)) {
        const pattern = routePattern.replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}$`).test(pathname)) {
          
          console.log('🔍 [MIDDLEWARE] Vérification des rôles pour:', pathname);
          
          try {
            // Récupérer le profil utilisateur pour vérifier le rôle
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            // ✅ GESTION DES ERREURS DE PROFIL
            if (profileError) {
              console.error('❌ [MIDDLEWARE] Erreur récupération profil:', profileError);
              
              if (profileError.code === 'PGRST116') {
                console.log('⚠️ [MIDDLEWARE] Profil utilisateur inexistant');
                // Rediriger vers la page d'accueil pour créer le profil
                return NextResponse.redirect(new URL('/', req.url));
              }
              
              // Pour d'autres erreurs, laisser passer
              console.log('⚠️ [MIDDLEWARE] Erreur profil, laissant la page gérer');
              return res;
            }

            if (!profile || !allowedRoles.includes(profile.role)) {
              console.log('🚫 [MIDDLEWARE] Accès refusé - rôle insuffisant:', profile?.role);
              return NextResponse.redirect(new URL('/', req.url));
            }
            
            console.log('✅ [MIDDLEWARE] Accès autorisé pour le rôle:', profile.role);
          } catch (profileException) {
            console.error('❌ [MIDDLEWARE] Exception profil:', profileException);
            // En cas d'exception, laisser passer pour éviter de bloquer
            return res;
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ [MIDDLEWARE] Exception générale:', error);
    // En cas d'erreur générale, laisser passer pour éviter de bloquer l'app
    return res;
  }

  return res;
}

// ✅ CONFIGURATION CORRIGÉE : Exclusion explicite des fichiers statiques
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation d'images Next.js)  
     * - favicon.ico (favicon)
     * - public (fichiers publics)
     * - api (routes API)
     * - Fichiers avec extensions (.css, .js, .woff, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api|.*\\.).*)',
  ],
};