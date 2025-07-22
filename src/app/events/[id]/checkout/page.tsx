// src/app/events/[id]/checkout/page.tsx - Sans message de transparence
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Loader2, Ticket, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getEventById } from '@/lib/data';
import { processCheckoutAction } from './actions';
import { SettingsService } from '@/services/settings';
import type { AppEvent } from '@/types';

const paymentSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse e-mail valide.",
  }),
  cardName: z.string().min(2, { message: "Le nom sur la carte est requis." }),
  cardNumber: z.string().length(16, { message: "Le numéro de carte doit comporter 16 chiffres." }).regex(/^\d+$/, { message: "Le numéro de carte doit contenir uniquement des chiffres." }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Date d'expiration invalide (MM/AA)." }),
  cvc: z.string().length(3, { message: "Le CVC doit comporter 3 chiffres." }).regex(/^\d+$/, { message: "Le CVC doit contenir uniquement des chiffres." }),
});

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(20);
  const ticketTypeId = searchParams.get('ticketTypeId');
  const quantity = parseInt(searchParams.get('quantity') || '1');

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      email: "",
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  // Charger les données au montage
  useEffect(() => {
    async function fetchEvent() {
      try {
        if (eventId) {
          const foundEvent = await getEventById(eventId);
          if (foundEvent) {
            setEvent(foundEvent);
          } else {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Erreur chargement événement:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    // Récupérer le taux de commission
    const currentCommissionRate = SettingsService.getCommissionRate();
    setCommissionRate(currentCommissionRate);

    fetchEvent();
  }, [eventId, router]);

  // Écouter les changements de commission
  useEffect(() => {
    const unsubscribe = SettingsService.onSettingsChange((settings) => {
      setCommissionRate(settings.commissionRate);
    });

    return unsubscribe;
  }, []);

  // ✅ Sélection sécurisée du ticket avec vérifications
  const selectedTicket = useMemo(() => {
    if (!event || !event.tickets || event.tickets.length === 0) {
      return null;
    }
    
    if (!ticketTypeId) {
      return event.tickets[0];
    }
    
    const foundTicket = event.tickets.find(t => t.id === ticketTypeId);
    return foundTicket || event.tickets[0];
  }, [event, ticketTypeId]);

  // ✅ Calculs corrigés : Client paie le prix affiché
  const clientTotal = useMemo(() => {
    if (!selectedTicket) return 0;
    // Le client paie exactement le prix affiché × quantité
    return selectedTicket.price * quantity;
  }, [selectedTicket, quantity]);

  const promoterRevenue = useMemo(() => {
    if (!selectedTicket) return 0;
    // Le promoteur reçoit le total moins la commission
    const commissionAmount = clientTotal * (commissionRate / 100);
    return clientTotal - commissionAmount;
  }, [clientTotal, commissionRate]);

  const adminCommission = useMemo(() => {
    if (!selectedTicket) return 0;
    // L'admin reçoit la commission
    return clientTotal * (commissionRate / 100);
  }, [clientTotal, commissionRate]);

  async function onSubmit(values: z.infer<typeof paymentSchema>) {
    if (!event || !selectedTicket) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la commande - données manquantes.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Traiter la commande avec les bons montants
      const result = await processCheckoutAction({
        email: values.email,
        eventId: event.id,
        ticketId: selectedTicket.id,
      });

      if (result.success) {
        toast({
          title: "Paiement réussi !",
          description: `Votre commande de ${quantity} billet${quantity > 1 ? 's' : ''} pour "${event.title}" a été confirmée.`,
        });
        router.push(`/events/${eventId}/confirmation`);
      }
    } catch (error) {
        toast({
            title: "Erreur de paiement",
            description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
            variant: "destructive"
        })
    }
  }

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  if (!event || !selectedTicket) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Données manquantes</h2>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const backLink = event.type === 'live' ? `/live/${event.id}` : 
                   event.type === 'vod' ? `/vod/${event.id}` : 
                   `/offline/${event.id}`;
  const isFree = clientTotal === 0;

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild>
        <Link href={backLink}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'événement
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            {isFree ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Check className="h-5 w-5" />
                    Confirmation gratuite
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Cet événement est gratuit. Confirmez votre participation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de confirmation</FormLabel>
                            <FormControl>
                              <Input placeholder="votre@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" size="lg">
                        <Check className="mr-2 h-4 w-4" />
                        Confirmer ma participation (Gratuit)
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informations de paiement
                  </CardTitle>
                  <CardDescription>
                    Saisissez vos informations pour finaliser l'achat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de confirmation</FormLabel>
                            <FormControl>
                              <Input placeholder="votre@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom sur la carte</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de carte</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="1234567890123456" 
                                maxLength={16}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date d'expiration</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/AA" maxLength={5} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="cvc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVC</FormLabel>
                              <FormControl>
                                <Input placeholder="123" maxLength={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" size="lg">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payer {clientTotal.toLocaleString('fr-FR')} XOF
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Résumé de commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={event.thumbnailUrl} 
                  alt={event.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{event.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {event.type.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Billet</span>
                  <span>{selectedTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantité</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix unitaire</span>
                  <span>{isFree ? 'Gratuit' : `${selectedTicket.price.toLocaleString('fr-FR')} XOF`}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{isFree ? 'Gratuit' : `${clientTotal.toLocaleString('fr-FR')} XOF`}</span>
              </div>

              {event.type === 'offline' && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-800 mb-1">Événement physique</p>
                  <p className="text-blue-700">
                    Vos billets seront disponibles en téléchargement après {isFree ? 'confirmation' : 'paiement'}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ SUPPRIMÉ : Section "Répartition transparente" */}
          {/* Cette section a été entièrement supprimée selon la demande */}
        </div>
      </div>
    </div>
  );
}