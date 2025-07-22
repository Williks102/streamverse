// src/app/admin/profile-settings/page.tsx
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
import { Loader2, Save, User, Mail, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Action simulée pour mettre à jour le profil admin
async function updateAdminProfile(values: ProfileFormValues) {
  console.log('(Simulation) Updating admin profile:', values);
  // Simuler un délai d'API
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: 'Profil administrateur mis à jour avec succès.' };
}

export default function AdminProfileSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const auth = useAuthClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    }
  });

  // Charger les données du profil
  useEffect(() => {
    if (auth.profile && auth.user) {
      form.reset({
        name: auth.profile.name || '',
        email: auth.user.email || '',
      });
    }
  }, [auth.profile, auth.user, form]);

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      try {
        const result = await updateAdminProfile(values);
        if (result.success) {
          toast({ 
            title: "Succès", 
            description: result.message 
          });
        } else {
          toast({ 
            title: "Erreur", 
            description: "Échec de la mise à jour du profil", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        toast({ 
          title: "Erreur", 
          description: "Une erreur s'est produite lors de la mise à jour", 
          variant: "destructive" 
        });
      }
    });
  };

  // Vérifier si l'utilisateur est admin
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
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

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Bouton de retour */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Dashboard
          </Link>
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

      {/* Informations actuelles */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="h-5 w-5" />
            Informations actuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2">
            <p><strong>Nom :</strong> {auth.profile?.name || 'Non défini'}</p>
            <p><strong>Email :</strong> {auth.user?.email || 'Non défini'}</p>
            <p><strong>Rôle :</strong> <span className="font-semibold">Administrateur</span></p>
            <p><strong>ID :</strong> {auth.user?.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifier les informations
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations personnelles
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

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
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
          <p className="text-sm">
            En tant qu'administrateur, votre compte dispose de privilèges élevés. 
            Assurez-vous de maintenir vos informations à jour et d'utiliser un mot de passe fort.
          </p>
          <Button variant="outline" className="mt-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100">
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}