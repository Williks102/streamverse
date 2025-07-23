// src/middleware.ts - Middleware d'authentification
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Rafraîchir la session si elle existe
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
    return new RegExp(`^${pattern}$`).test(req.nextUrl.pathname);
  });

  if (isProtectedRoute && !session) {
    // Rediriger vers la page de connexion avec l'URL de retour
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname);
    
    console.log('🔒 Route protégée accédée sans authentification:', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Vérifier les rôles pour les routes spécifiques
  if (session?.user) {
    for (const [routePattern, allowedRoles] of Object.entries(roleProtectedRoutes)) {
      const pattern = routePattern.replace(/\*/g, '.*');
      if (new RegExp(`^${pattern}$`).test(req.nextUrl.pathname)) {
        // Récupérer le profil utilisateur pour vérifier le rôle
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile || !allowedRoles.includes(profile.role)) {
          console.log('🚫 Accès refusé - rôle insuffisant:', profile?.role);
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    }
  }

  return res;
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - public (fichiers publics)
     * - api (routes API)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};