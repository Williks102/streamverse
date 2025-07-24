// src/app/auth/login/page.tsx - VERSION CORRIGÉE ERREURS TYPESCRIPT
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

// ✅ CORRECTION: Interface pour le profil
interface UserProfile {
  role: string;
  name: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Récupérer l'URL de retour et la valider
  const rawReturnUrl = searchParams.get('returnUrl') || '/';
  
  const getValidReturnUrl = (url: string): string => {
    // Éviter les boucles vers les pages d'auth
    if (url.startsWith('/auth/')) {
      return '/account';
    }
    
    // Éviter les URLs externes
    if (url.startsWith('http') || !url.startsWith('/')) {
      return '/account';
    }
    
    return url;
  };
  
  const returnUrl = getValidReturnUrl(rawReturnUrl);

  // Fonction de debugging améliorée
  const addDebugInfo = (message: string) => {
    console.log(`🔍 [LOGIN DEBUG] ${message}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  // Fonction de redirection avec retry
  const performRedirection = async (targetUrl: string, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      addDebugInfo(`Tentative de redirection vers: ${targetUrl} (essai ${retryCount + 1})`);
      
      // Vérifier si la page cible existe avant de rediriger
      try {
        const response = await fetch(targetUrl, { method: 'HEAD' });
        if (response.status === 403) {
          addDebugInfo(`⚠️ 403 Forbidden pour ${targetUrl} - Tentative de redirection vers /account`);
          if (targetUrl !== '/account') {
            return await performRedirection('/account', 0);
          }
        }
      } catch (fetchError) {
        addDebugInfo(`⚠️ Erreur vérification URL ${targetUrl}: ${fetchError}`);
      }
      
      // Effectuer la redirection
      window.location.href = targetUrl;
      
      // Fallback avec router si la redirection directe échoue
      setTimeout(() => {
        router.replace(targetUrl);
      }, 1000);
      
    } catch (error) {
      addDebugInfo(`❌ Erreur redirection: ${error}`);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          performRedirection(targetUrl, retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        // Redirection de secours vers la page d'accueil
        addDebugInfo('🏠 Redirection de secours vers /');
        window.location.href = '/';
      }
    }
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        addDebugInfo('Vérification de la session existante...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebugInfo(`❌ Erreur session: ${sessionError.message}`);
          setIsCheckingAuth(false);
          return;
        }
        
        if (session?.user) {
          addDebugInfo(`✅ Session trouvée pour: ${session.user.email}`);
          
          // ✅ CORRECTION: Déclaration de variable let au lieu de const
          let profile: UserProfile | null = null;
          
          // Récupérer le profil avec gestion d'erreur améliorée
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role, name')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              addDebugInfo(`⚠️ Erreur profil: ${profileError.message} (Code: ${profileError.code})`);
              
              if (profileError.code === 'PGRST116') {
                // Profil n'existe pas - créer un profil par défaut
                addDebugInfo('🔧 Création d\'un profil par défaut...');
                
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert([{
                    id: session.user.id,
                    name: session.user.email?.split('@')[0] || 'Utilisateur',
                    role: 'user',
                    avatar_url: null,
                  }]);

                if (createError) {
                  addDebugInfo(`❌ Erreur création profil: ${createError.message}`);
                  toast({
                    title: "Erreur de profil",
                    description: "Impossible de créer votre profil. Contactez l'administrateur.",
                    variant: "destructive"
                  });
                  setIsCheckingAuth(false);
                  return;
                } else {
                  addDebugInfo('✅ Profil créé avec succès');
                  // ✅ CORRECTION: Assignation à la variable let
                  profile = { role: 'user', name: session.user.email?.split('@')[0] || 'Utilisateur' };
                }
              } else {
                // Autre erreur de profil - continuer avec un rôle par défaut
                addDebugInfo('⚠️ Utilisation du rôle par défaut');
                profile = { role: 'user', name: 'Utilisateur' };
              }
            } else {
              // ✅ CORRECTION: Assignation des données du profil
              profile = profileData;
            }
            
            addDebugInfo(`👤 Profil: ${profile?.name} - Rôle: ${profile?.role}`);
            
            // Déterminer l'URL de redirection
            let redirectUrl = '/account'; // Par défaut
            
            if (returnUrl && returnUrl !== '/' && returnUrl !== '/auth/login') {
              redirectUrl = returnUrl;
              addDebugInfo(`🎯 Utilisation de returnUrl: ${returnUrl}`);
            } else if (profile?.role === 'admin') {
              redirectUrl = '/admin/dashboard';
              addDebugInfo('🔧 Redirection admin vers dashboard');
            } else if (profile?.role === 'promoter') {
              redirectUrl = '/promoter/dashboard';
              addDebugInfo('🎪 Redirection promoteur vers dashboard');
            } else {
              redirectUrl = '/account';
              addDebugInfo('👤 Redirection utilisateur vers account');
            }
            
            // Effectuer la redirection
            await performRedirection(redirectUrl);
            
          } catch (profileException) {
            addDebugInfo(`❌ Exception profil: ${profileException}`);
            // Redirection vers account par défaut
            await performRedirection('/account');
          }
          
        } else {
          addDebugInfo('ℹ️ Aucune session trouvée');
        }
        
      } catch (error) {
        addDebugInfo(`❌ Exception checkAuth: ${error}`);
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
    addDebugInfo(`🔐 Tentative de connexion: ${email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        addDebugInfo(`❌ Erreur connexion: ${error.message}`);
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
        addDebugInfo('❌ Aucun utilisateur retourné');
        toast({
          title: "Erreur",
          description: "Aucun utilisateur retourné",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      addDebugInfo(`✅ Connexion réussie: ${data.user.email}`);

      // ✅ CORRECTION: Déclaration de variable let pour profile
      let profile: UserProfile | null = null;
      
      // Récupérer le profil avec gestion d'erreur
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          addDebugInfo(`⚠️ Erreur profil après connexion: ${profileError.message}`);
          
          if (profileError.code === 'PGRST116') {
            // Créer le profil manquant
            addDebugInfo('🔧 Création profil après connexion...');
            
            const { error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: data.user.id,
                name: data.user.email?.split('@')[0] || 'Utilisateur',
                role: 'user',
                avatar_url: null,
              }]);

            if (!createError) {
              profile = { role: 'user', name: data.user.email?.split('@')[0] || 'Utilisateur' };
              addDebugInfo('✅ Profil créé après connexion');
            }
          }
        } else {
          // ✅ CORRECTION: Assignation correcte des données
          profile = profileData;
          addDebugInfo(`👤 Profil récupéré: ${profile.name} - ${profile.role}`);
        }
      } catch (profileException) {
        addDebugInfo(`❌ Exception profil: ${profileException}`);
      }

      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      });

      // Déterminer l'URL de redirection
      let redirectUrl = '/account';
      
      if (returnUrl && returnUrl !== '/' && returnUrl !== '/auth/login') {
        redirectUrl = returnUrl;
        addDebugInfo(`🎯 Utilisation returnUrl: ${redirectUrl}`);
      } else if (profile?.role === 'admin') {
        redirectUrl = '/admin/dashboard';
        addDebugInfo('🔧 Redirection admin');
      } else if (profile?.role === 'promoter') {
        redirectUrl = '/promoter/dashboard';
        addDebugInfo('🎪 Redirection promoteur');
      } else {
        redirectUrl = '/account';
        addDebugInfo('👤 Redirection utilisateur');
      }

      // Attendre un peu pour que l'auth state se synchronise
      setTimeout(async () => {
        await performRedirection(redirectUrl);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      addDebugInfo(`❌ Exception handleSubmit: ${error}`);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Afficher le loader pendant la vérification
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Vérification de la session...</p>
          
          {/* Debug info pendant le chargement */}
          {debugInfo.length > 0 && (
            <div className="text-left text-xs space-y-1 bg-muted p-3 rounded">
              {debugInfo.map((info, index) => (
                <div key={index} className="font-mono">
                  {info.includes('❌') ? (
                    <span className="text-red-600">{info}</span>
                  ) : info.includes('✅') ? (
                    <span className="text-green-600">{info}</span>
                  ) : info.includes('⚠️') ? (
                    <span className="text-yellow-600">{info}</span>
                  ) : (
                    <span className="text-muted-foreground">{info}</span>
                  )}
                </div>
              ))}
            </div>
          )}
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
            Connectez-vous à votre compte pour accéder à vos événements
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Info de redirection */}
          {returnUrl !== '/' && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous serez redirigé vers <strong>{returnUrl}</strong> après connexion
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
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
              href={`/auth/register${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="text-primary hover:underline font-medium"
            >
              S'inscrire
            </Link>
          </div>

          {/* Debug info */}
          {debugInfo.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                🔍 Informations de débogage ({debugInfo.length})
              </summary>
              <div className="mt-2 text-xs space-y-1 bg-muted p-3 rounded max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="font-mono">
                    {info.includes('❌') ? (
                      <span className="text-red-600">{info}</span>
                    ) : info.includes('✅') ? (
                      <span className="text-green-600">{info}</span>
                    ) : info.includes('⚠️') ? (
                      <span className="text-yellow-600">{info}</span>
                    ) : (
                      <span className="text-muted-foreground">{info}</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}