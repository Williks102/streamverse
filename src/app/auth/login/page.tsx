// src/app/auth/login/page.tsx - AVEC REDIRECTION INTELLIGENTE PAR RÔLE
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, Loader2, LogIn, Tv2 } from 'lucide-react';
import type { Database } from '@/types/database';

// Client Supabase direct
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState('koffiw4@gmail.com');
  const [password, setPassword] = useState('promoter123');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Tentative de connexion pour:', email);

      // 1. Connexion Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (!data.user) {
        toast({
          title: "Erreur",
          description: "Aucun utilisateur retourné",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Connexion réussie pour:', data.user.email);

      // 2. Récupérer le profil utilisateur pour déterminer le rôle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError);
        
        // Si pas de profil, créer un profil par défaut
        if (profileError.code === 'PGRST116') {
          console.log('🔧 Création d\'un profil par défaut...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name: data.user.email?.split('@')[0] || 'Utilisateur',
              role: 'user', // Rôle par défaut
              avatar_url: null,
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Erreur création profil:', createError);
            toast({
              title: "Erreur",
              description: "Impossible de créer le profil utilisateur",
              variant: "destructive"
            });
            return;
          }

          // Redirection vers user dashboard par défaut
          toast({
            title: "Connexion réussie !",
            description: `Bienvenue ${data.user.email} (nouveau compte)`,
          });
          router.push('/account');
          return;
        }

        toast({
          title: "Erreur",
          description: "Impossible de récupérer le profil utilisateur",
          variant: "destructive"
        });
        return;
      }

      console.log('👤 Profil récupéré:', { role: profile.role, name: profile.name });

      // 3. Redirection selon le rôle
      let redirectPath = '/account'; // Par défaut pour les users
      let roleMessage = 'utilisateur';

      switch (profile.role) {
        case 'admin':
          redirectPath = '/admin/dashboard';
          roleMessage = 'administrateur';
          break;
        case 'promoter':
          redirectPath = '/promoter/dashboard';
          roleMessage = 'promoteur';
          break;
        case 'user':
        default:
          redirectPath = '/account';
          roleMessage = 'utilisateur';
          break;
      }

      toast({
        title: "Connexion réussie !",
        description: `Bienvenue ${profile.name || data.user.email} (${roleMessage})`,
      });

      console.log(`🎯 Redirection vers: ${redirectPath}`);
      router.push(redirectPath);
      router.refresh(); // Force le rafraîchissement

    } catch (error) {
      console.error('❌ Exception lors de la connexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-700 ">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tv2 size={32} className="text-primary" />
            <h1 className="text-2xl font-bold text-primary">StreamVerse</h1>
          </div>
          <p className="text-muted-foreground">Connectez-vous à votre compte</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
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
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
            
            {/* Informations de test */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                🧪 Comptes de test
              </h4>
              <div className="text-xs text-blue-700 space-y-2">
                <div>
                  <p><strong>Admin :</strong> admin@streamverse.com</p>
                  <p><strong>Promoteur :</strong> koffiw4@gmail.com</p>
                  <p><strong>Mot de passe :</strong> promoter123</p>
                </div>
              </div>
            </div>

            {/* Liens utiles */}
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                className="text-sm text-muted-foreground"
                onClick={() => router.push('/')}
              >
                ← Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          StreamVerse - Plateforme d'événements en streaming
        </div>
      </div>
    </div>
  );
}