// src/app/admin/profile-settings/page.tsx - Version avec persistance réelle
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthClient } from "@/hooks/useAuthClient";
import { Loader2, Save, User, Mail, Shield, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { updateAdminProfile, getAdminProfile, type UpdateAdminProfileData } from './actions';

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface AdminProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminProfileSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const auth = useAuthClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    }
  });

  // Charger les données du profil au montage
  useEffect(() => {
    const loadProfileData = async () => {
      if (!auth.user?.id) return;

      try {
        setIsLoading(true);
        console.log('📡 Chargement profil admin...');

        const result = await getAdminProfile(auth.user.id);
        
        if (result.success && result.data) {
          setProfileData(result.data);
          form.reset({
            name: result.data.name || '',
            email: result.data.email || '',
          });
          console.log('✅ Profil admin chargé:', result.data);
        } else {
          toast({
            title: "Erreur",
            description: result.message || "Impossible de charger le profil",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du profil",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.user?.id && !auth.isLoading) {
      loadProfileData();
    }
  }, [auth.user?.id, auth.isLoading, form, toast]);

  const onSubmit = (values: ProfileFormValues) => {
    if (!auth.user?.id) {
      toast({
        title: "Erreur",
        description: "Utilisateur non identifié",
        variant: "destructive"
      });
      return;
    }

    startTransition(async () => {
      try {
        console.log('💾 Sauvegarde profil admin...', values);

        const updateData: UpdateAdminProfileData = {
          ...values,
          userId: auth.user!.id,
        };

        const result = await updateAdminProfile(updateData);

        if (result.success) {
          // Mettre à jour les données locales
          if (profileData && result.data) {
            const updatedProfile = {
              ...profileData,
              name: result.data.name,
              email: result.data.email,
              updated_at: result.data.updated_at,
            };
            setProfileData(updatedProfile);
          }

          setLastSaved(new Date());
          
          toast({ 
            title: "✅ Succès", 
            description: result.message,
            duration: 3000,
          });

          // Forcer la mise à jour du contexte auth
          if (auth.refreshProfile) {
            await auth.refreshProfile();
          }
          
        } else {
          toast({ 
            title: "❌ Erreur", 
            description: result.message || "Erreur lors de la sauvegarde", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde profil admin:', error);
        toast({ 
          title: "❌ Erreur", 
          description: "Une erreur inattendue s'est produite", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleRefresh = async () => {
    if (!auth.user?.id) return;

    try {
      setIsLoading(true);
      const result = await getAdminProfile(auth.user.id);
      
      if (result.success && result.data) {
        setProfileData(result.data);
        form.reset({
          name: result.data.name || '',
          email: result.data.email || '',
        });
        
        toast({
          title: "✅ Actualisé",
          description: "Données du profil rechargées"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier l'authentification et le rôle
  if (auth.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement du profil administrateur...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated || auth.profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Accès refusé</h1>
          <p className="text-muted-foreground mb-4">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculer si il y a des modifications non sauvegardées
  const currentValues = form.watch();
  const hasUnsavedChanges = profileData && (
    currentValues.name !== (profileData.name || '') ||
    currentValues.email !== profileData.email
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Bouton de retour */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Dashboard
          </Link>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* En-tête */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Paramètres du Profil Administrateur</h1>
        </div>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et paramètres de compte administrateur
        </p>
      </div>

      {/* Indicateur de statut */}
      {lastSaved && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">
                Dernière sauvegarde : {lastSaved.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations actuelles */}
      {profileData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <User className="h-5 w-5" />
              Informations actuelles
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={profileData.avatar_url || undefined} 
                  alt={profileData.name || 'Admin'} 
                />
                <AvatarFallback className="text-lg">
                  {profileData.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {profileData.name || 'Nom non défini'}
                </h3>
                <p className="text-blue-700">{profileData.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <p><strong>Rôle :</strong> <span className="font-semibold">Administrateur</span></p>
              <p><strong>ID :</strong> {profileData.id}</p>
              <p><strong>Créé le :</strong> {new Date(profileData.created_at).toLocaleDateString('fr-FR')}</p>
              <p><strong>Mis à jour :</strong> {new Date(profileData.updated_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire de modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifier les informations
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations personnelles. Les modifications seront sauvegardées de manière permanente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nom complet
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Votre nom complet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Adresse email
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="votre@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isPending || !hasUnsavedChanges}
                  className="flex-1"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde en cours...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {hasUnsavedChanges ? 'Sauvegarder les modifications' : 'Aucune modification'}
                    </>
                  )}
                </Button>
              </div>

              {hasUnsavedChanges && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                  ⚠️ Vous avez des modifications non sauvegardées
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Informations de sécurité */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <div className="space-y-3">
            <p className="text-sm">
              En tant qu'administrateur, votre compte dispose de privilèges élevés. 
              Assurez-vous de maintenir vos informations à jour et d'utiliser un mot de passe fort.
            </p>
            
            <div className="bg-yellow-100 p-3 rounded border">
              <p className="text-sm font-medium text-yellow-800 mb-2">Données sauvegardées :</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Profil : Base de données Supabase</li>
                <li>• Email : Système d'authentification</li>
                <li>• Modifications : Temps réel avec revalidation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}