// src/components/admin/AdminSettings.tsx - Version corrigée avec persistance localStorage
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useTransition, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateSiteSettings } from "@/app/admin/dashboard/actions";
import { SettingsService, type SiteSettings } from "@/services/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Percent, Save, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const settingsSchema = z.object({
  siteName: z.string().min(3, "Le nom du site est requis."),
  commissionRate: z.coerce.number().min(0).max(100, "La commission doit être entre 0 et 100."),
  maintenanceMode: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        siteName: 'StreamVerse',
        commissionRate: 20,
        maintenanceMode: false,
    }
  });

  // Attendre le montage côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Charger les paramètres depuis localStorage côté client
  useEffect(() => {
    if (isMounted) {
      const settings = SettingsService.getSettings();
      form.reset(settings);
      console.log('✅ Paramètres chargés depuis localStorage:', settings);
    }
  }, [isMounted, form]);

  // ✅ Écouter les changements de paramètres en temps réel
  useEffect(() => {
    if (!isMounted) return;

    const unsubscribe = SettingsService.onSettingsChange((newSettings: SiteSettings) => {
      console.log('✅ Paramètres mis à jour détectés:', newSettings);
      form.reset(newSettings);
      setLastSaved(new Date());
    });

    return unsubscribe;
  }, [isMounted, form]);

  const onSubmit = (values: SettingsFormValues) => {
    startTransition(async () => {
      try {
        // 1. ✅ Sauvegarder immédiatement côté client (localStorage)
        const saved = SettingsService.saveSettings(values);
        
        if (!saved) {
          throw new Error('Échec de la sauvegarde locale');
        }

        console.log('✅ Paramètres sauvegardés en localStorage:', values);

        // 2. ✅ Notifier le serveur pour revalidation des pages
        const result = await updateSiteSettings(values);
        
        setLastSaved(new Date());
        
        if (result.success) {
          toast({ 
            title: "✅ Succès", 
            description: "Paramètres mis à jour et appliqués sur toute la plateforme",
            duration: 3000,
          });
          
          // 3. ✅ Déclencher un événement pour les autres composants
          const event = new CustomEvent('commissionUpdated', { 
            detail: { newRate: values.commissionRate } 
          });
          window.dispatchEvent(event);
          
        } else {
          toast({ 
            title: "⚠️ Attention", 
            description: "Paramètres sauvegardés mais problème de synchronisation serveur", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast({ 
          title: "❌ Erreur", 
          description: "Échec de la sauvegarde des paramètres", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleReset = () => {
    if (!isMounted) return;
    
    const defaultSettings = {
      siteName: 'StreamVerse',
      commissionRate: 20,
      maintenanceMode: false,
    };
    
    SettingsService.saveSettings(defaultSettings);
    form.reset(defaultSettings);
    setLastSaved(new Date());
    
    toast({
      title: "🔄 Réinitialisation",
      description: "Paramètres remis aux valeurs par défaut"
    });
  };

  // Calculer les changements non sauvegardés
  const currentValues = form.watch();
  const savedSettings = isMounted ? SettingsService.getSettings() : currentValues;
  const hasUnsavedChanges = JSON.stringify(currentValues) !== JSON.stringify(savedSettings);

  // Afficher un loader pendant le montage
  if (!isMounted) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Chargement des paramètres...</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de statut */}
      <Card className={`${lastSaved ? 'bg-green-50 border-green-200' : hasUnsavedChanges ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastSaved ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Dernière sauvegarde : {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Modifications non sauvegardées</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Paramètres synchronisés</span>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Commission actuelle: <strong>{SettingsService.getCommissionRate()}%</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire principal */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
          <CardDescription>
            Gérez les configurations globales de la plateforme. Les changements sont appliqués immédiatement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Site</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de Commission par Défaut</FormLabel>
                     <div className="relative">
                       <Input 
                         type="number" 
                         {...field} 
                         className="pl-8"
                         min="0"
                         max="100"
                         step="0.1"
                       />
                       <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     </div>
                    <FormDescription>
                      La commission appliquée sur les ventes des promoteurs. Cette valeur est utilisée sur tout le site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Mode Maintenance</FormLabel>
                        <FormDescription>
                          Désactive temporairement l'accès public au site.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
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
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder les modifications
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleReset}
                  disabled={isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Informations techniques */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Informations Techniques</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>Persistance :</strong> localStorage (côté client) + revalidation serveur</p>
            <p><strong>Propagation :</strong> Temps réel via événements personnalisés</p>
            <p><strong>Effet :</strong> Les modifications sont appliquées immédiatement sur tout le site</p>
            <p><strong>Statut :</strong> {hasUnsavedChanges ? 'Modifications en attente' : 'Synchronisé'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}