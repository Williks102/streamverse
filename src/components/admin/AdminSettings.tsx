
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSiteSettings, updateSiteSettings } from "@/app/admin/dashboard/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Percent, Save } from "lucide-react";

const settingsSchema = z.object({
  siteName: z.string().min(3, "Le nom du site est requis."),
  commissionRate: z.coerce.number().min(0).max(100, "La commission doit être entre 0 et 100."),
  maintenanceMode: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        siteName: '',
        commissionRate: 20,
        maintenanceMode: false,
    }
  });

  useEffect(() => {
    getSiteSettings().then(settings => {
      form.reset(settings);
    });
  }, [form]);

  const onSubmit = (values: SettingsFormValues) => {
    startTransition(async () => {
      const result = await updateSiteSettings(values);
      if (result.success) {
        toast({ title: "Succès", description: result.message });
      } else {
        toast({ title: "Erreur", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Paramètres Généraux</CardTitle>
        <CardDescription>Gérez les configurations globales de la plateforme.</CardDescription>
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
                     <Input type="number" {...field} className="pl-8"/>
                     <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   </div>
                  <FormDescription>
                    La commission appliquée sur les ventes des promoteurs.
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
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer les Paramètres
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
