// src/components/AccountSettings.tsx - AVEC VRAIES DONNÉES
"use client";

import { useState, useTransition } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, KeyRound, Loader2, Save } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const profileSchema = z.object({
  name: z.string().min(1, { message: "Le nom est requis." }),
  email: z.string().email({ message: "L'adresse e-mail est invalide." }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Le mot de passe actuel est requis." }),
  newPassword: z.string().min(6, { message: "Le nouveau mot de passe doit comporter au moins 6 caractères." }),
  confirmPassword: z.string().min(1, { message: "La confirmation est requise." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'promoter' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AccountSettingsProps {
  userData: UserData;
  onUserDataUpdate: (userData: UserData) => void;
}

export default function AccountSettings({ userData, onUserDataUpdate }: AccountSettingsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Formulaire profil avec données réelles
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData.name || '',
      email: userData.email,
    },
  });

  // Formulaire mot de passe
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mise à jour du profil
  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    startTransition(async () => {
      try {
        console.log('🔄 Mise à jour profil:', values);

        // 1. Mettre à jour le profil dans la table profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: values.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.id);

        if (profileError) {
          throw new Error(`Erreur mise à jour profil: ${profileError.message}`);
        }

        // 2. Mettre à jour l'email dans auth (si différent)
        if (values.email !== userData.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: values.email
          });

          if (emailError) {
            console.warn('Erreur mise à jour email:', emailError);
            toast({
              title: "Attention",
              description: "Le profil a été mis à jour, mais l'email nécessite une confirmation.",
              variant: "default"
            });
          }
        }

        // 3. Mettre à jour les données locales
        const updatedUserData: UserData = {
          ...userData,
          name: values.name,
          email: values.email,
          updated_at: new Date().toISOString(),
        };

        onUserDataUpdate(updatedUserData);

        toast({
          title: "Succès",
          description: "Votre profil a été mis à jour avec succès.",
        });

      } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors de la mise à jour.",
          variant: "destructive",
        });
      }
    });
  };

  // Mise à jour du mot de passe
  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    startTransition(async () => {
      try {
        console.log('🔒 Mise à jour mot de passe...');

        // Vérifier d'abord le mot de passe actuel en tentant une connexion
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: values.currentPassword,
        });

        if (verifyError) {
          toast({
            title: "Erreur",
            description: "Le mot de passe actuel est incorrect.",
            variant: "destructive",
          });
          return;
        }

        // Mettre à jour le mot de passe
        const { error: updateError } = await supabase.auth.updateUser({
          password: values.newPassword
        });

        if (updateError) {
          throw new Error(`Erreur mise à jour mot de passe: ${updateError.message}`);
        }

        toast({
          title: "Succès",
          description: "Votre mot de passe a été mis à jour avec succès.",
        });

        passwordForm.reset();

      } catch (error) {
        console.error('❌ Erreur mise à jour mot de passe:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors de la mise à jour.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Informations du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du Profil
          </CardTitle>
          <CardDescription>
            Modifiez vos informations personnelles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Votre nom complet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="votre@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
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

      {/* Sécurité - Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe pour sécuriser votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} variant="outline">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Informations du compte */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>Détails de votre compte StreamVerse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">ID utilisateur :</span>
            <span className="text-sm text-muted-foreground font-mono">{userData.id}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">Type de compte :</span>
            <span className="text-sm text-muted-foreground capitalize">{userData.role}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">Membre depuis :</span>
            <span className="text-sm text-muted-foreground">
              {new Date(userData.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">Dernière mise à jour :</span>
            <span className="text-sm text-muted-foreground">
              {new Date(userData.updated_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}