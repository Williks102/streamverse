// src/app/auth/login/page.tsx - VERSION CORRIGÉE SANS BOUCLE
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, Loader2, LogIn, Tv2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Récupérer l'URL de retour
  const returnUrl = searchParams.get('returnUrl') || '/';

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('🔄 Utilisateur déjà connecté, redirection...');
          
          // Récupérer le profil pour le rôle
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          // Redirection selon le contexte
          if (returnUrl && returnUrl !== '/' && returnUrl !== '/auth/login') {
            router.replace(returnUrl);
          } else if (profile?.role === 'admin') {
            router.replace('/admin/dashboard');
          } else if (profile?.role === 'promoter') {
            router.replace('/promoter/dashboard');
          } else {
            router.replace('/account');
          }
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Tentative de connexion pour:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);
        toast({
          title: "Erreur de connexion",
          description: error.message === "Invalid login credentials" 
            ? "Email ou mot de passe incorrect" 
            : error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          title: "Erreur",
          description: "Aucun utilisateur retourné",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Connexion réussie pour:', data.user.email);

      // Récupérer le profil pour connaître le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      });

      // Utiliser router.replace au lieu de router.push pour éviter l'historique
      setTimeout(() => {
        if (returnUrl && returnUrl !== '/' && returnUrl !== '/auth/login') {
          // Vérifier que l'URL de retour n'est pas la page de login elle-même
          router.replace(returnUrl);
        } else if (profile?.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (profile?.role === 'promoter') {
          router.replace('/promoter/dashboard');
        } else {
          router.replace('/account');
        }
      }, 500);

    } catch (error) {
      console.error('❌ Exception:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant la vérification initiale
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
              <Tv2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {returnUrl && returnUrl !== '/' && returnUrl !== '/auth/login' && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous devez vous connecter pour accéder à cette page
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
                tabIndex={-1}
              >
                Mot de passe oublié ?
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Pas encore de compte ? </span>
            <Link
              href={`/auth/register${returnUrl && returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </div>

          {/* Comptes de test pour démo */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Comptes de test :</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>👤 User: demo@example.com / demo123</p>
              <p>🎭 Promoteur: koffiw4@gmail.com / promoter123</p>
              <p>👑 Admin: admin@example.com / admin123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}