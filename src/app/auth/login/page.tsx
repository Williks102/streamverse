// src/app/auth/login/page.tsx - Page de connexion corrigée
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthClient } from '@/hooks/useAuthClient';

export default function LoginPage() {
  const [email, setEmail] = useState('koffiw4@gmail.com');
  const [password, setPassword] = useState('promoter123');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuthClient();

  // ✅ Utiliser useEffect pour la redirection
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.push('/promoter/dashboard');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await auth.signIn(email, password);
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté"
        });
        // La redirection se fera automatiquement via useEffect
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Afficher loading pendant la vérification d'auth
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // ✅ Ne pas afficher le formulaire si déjà connecté
  if (auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirection vers le dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion StreamVerse</CardTitle>
          <CardDescription>Connectez-vous à votre compte promoteur</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Compte test :</strong><br />
              Email : koffiw4@gmail.com<br />
              Mot de passe : promoter123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}