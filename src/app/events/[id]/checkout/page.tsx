// src/app/events/[id]/checkout/page.tsx - VERSION CORRIGÉE
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
import { ArrowLeft, CreditCard, Loader2, Ticket, Check, Info, AlertCircle, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getEventById } from '@/lib/data';
import { processCheckoutActionWithAuth } from './actions';
import { SettingsService } from '@/services/settings';
import { useAuthClient } from '@/hooks/useAuthClient';
import type { AppEvent, Ticket as TicketType } from '@/types';

interface SelectedTicket {
  ticketId: string;
  quantity: number;
}

// Définir le type TicketDetail pour éviter les erreurs
interface TicketDetail {
  ticket: TicketType;
  quantity: number;
  subtotal: number;
}

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
  const auth = useAuthClient();
  
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(20);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      email: auth.user?.email || "",
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  // Mettre à jour l'email si l'utilisateur se connecte
  useEffect(() => {
    if (auth.user?.email && !form.getValues('email')) {
      form.setValue('email', auth.user.email);
    }
  }, [auth.user, form]);

  // Parser les tickets depuis l'URL
  useEffect(() => {
    const ticketsParam = searchParams.get('tickets');
    if (ticketsParam) {
      try {
        const parsedTickets = JSON.parse(decodeURIComponent(ticketsParam));
        setSelectedTickets(parsedTickets);
      } catch (error) {
        console.error('Erreur parsing tickets:', error);
        const ticketTypeId = searchParams.get('ticketTypeId');
        const quantity = parseInt(searchParams.get('quantity') || '1');
        if (ticketTypeId) {
          setSelectedTickets([{ ticketId: ticketTypeId, quantity }]);
        }
      }
    } else {
      const ticketTypeId = searchParams.get('ticketTypeId');
      const quantity = parseInt(searchParams.get('quantity') || '1');
      if (ticketTypeId) {
        setSelectedTickets([{ ticketId: ticketTypeId, quantity }]);
      }
    }
  }, [searchParams]);

  // Charger l'événement
  useEffect(() => {
    async function fetchEvent() {
      try {
        setIsLoading(true);
        if (eventId) {
          const foundEvent = await getEventById(eventId);
          if (foundEvent) {
            setEvent(foundEvent);
          } else {
            toast({
              title: "Événement introuvable",
              description: "L'événement demandé n'existe pas.",
              variant: "destructive"
            });
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Erreur chargement événement:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données de l'événement.",
          variant: "destructive"
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    const currentCommissionRate = SettingsService.getCommissionRate();
    setCommissionRate(currentCommissionRate);

    fetchEvent();
  }, [eventId, router, toast]);

  // Écouter les changements de commission
  useEffect(() => {
    const unsubscribe = SettingsService.onSettingsChange((settings) => {
      setCommissionRate(settings.commissionRate);
    });

    return unsubscribe;
  }, []);

  // Calculer les totaux avec typage correct
  const { clientTotal, promoterRevenue, adminCommission, ticketDetails } = useMemo(() => {
    if (!event || !event.tickets || selectedTickets.length === 0) {
      return { 
        clientTotal: 0, 
        promoterRevenue: 0, 
        adminCommission: 0, 
        ticketDetails: [] as TicketDetail[] 
      };
    }

    const details: TicketDetail[] = selectedTickets
      .map(selected => {
        const ticket = event.tickets?.find(t => t.id === selected.ticketId);
        if (!ticket) return null;
        
        const subtotal = ticket.price * selected.quantity;
        return {
          ticket,
          quantity: selected.quantity,
          subtotal
        };
      })
      .filter((detail): detail is TicketDetail => detail !== null);

    const total = details.reduce((sum, detail) => sum + detail.subtotal, 0);
    const commission = total * (commissionRate / 100);

    return {
      clientTotal: total,
      promoterRevenue: total - commission,
      adminCommission: commission,
      ticketDetails: details
    };
  }, [event, selectedTickets, commissionRate]);

  async function onSubmit(values: z.infer<typeof paymentSchema>) {
    // Vérifier l'authentification avant de procéder
    if (!auth.isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!event || selectedTickets.length === 0) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter la commande - données manquantes.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Obtenir les informations utilisateur
      const userInfo = auth.getUserInfoForServerAction();
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Traiter la commande avec authentification
      const firstTicket = selectedTickets[0];
      const result = await processCheckoutActionWithAuth({
        email: values.email,
        eventId: event.id,
        ticketId: firstTicket.ticketId,
        userId: userInfo.id,
        userEmail: userInfo.email,
      });

      if (result.success) {
        toast({
          title: "Paiement réussi !",
          description: `Votre commande pour "${event.title}" a été confirmée.`,
        });
        router.push(`/events/${eventId}/confirmation`);
      }
    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        variant: "destructive"
      });
    }
  }

  // États de chargement et d'erreur
  if (isLoading || auth.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event || selectedTickets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Données manquantes</h2>
          <p className="text-muted-foreground mb-4">
            Aucun ticket sélectionné ou événement introuvable.
          </p>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </Card>
      </div>
    );
  }
  
  const backLink = event.type === 'live' ? `/live/${event.id}` : 
                   event.type === 'vod' ? `/vod/${event.id}` : 
                   `/offline/${event.id}`;
  const isFree = clientTotal === 0;

  // Prompt de connexion
  if (showAuthPrompt && !auth.isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour finaliser votre achat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                La connexion vous permet de :
                <ul className="list-disc list-inside mt-2">
                  <li>Suivre vos commandes</li>
                  <li>Accéder à vos billets électroniques</li>
                  <li>Recevoir des notifications d'événements</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                asChild 
                className="flex-1"
                size="lg"
              >
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                  Se connecter
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Link href={`/auth/register?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                  Créer un compte
                </Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full"
            >
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild>
        <Link href={backLink}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'événement
        </Link>
      </Button>

      {/* Afficher un bandeau si non connecté */}
      {!auth.isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Créez un compte</strong> pour suivre vos commandes et accéder facilement à vos billets.
            <Link href="/auth/register" className="ml-2 underline">
              S'inscrire maintenant
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          {/* Formulaire de paiement */}
          {isFree ? (
            <Card>
              <CardHeader>
                <CardTitle>Confirmation de Réservation</CardTitle>
                <CardDescription>
                  Cet événement est gratuit. Confirmez votre email pour réserver votre place.
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse e-mail</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="votre.email@exemple.com"
                              disabled={auth.isAuthenticated}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Événement Gratuit</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Aucun paiement requis. Votre place sera réservée après confirmation.
                      </p>
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg">
                      {auth.isAuthenticated ? 'Confirmer la réservation' : 'Se connecter et réserver'}
                    </Button>
                  </CardContent>
                </form>
              </Form>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Informations de Paiement</CardTitle>
                <CardDescription>
                  Complétez vos informations pour finaliser l'achat.
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse e-mail</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="votre.email@exemple.com"
                              disabled={auth.isAuthenticated}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="cardName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom sur la carte</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Jean Dupont" />
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
                            <Input {...field} placeholder="1234567890123456" maxLength={16} />
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
                              <Input {...field} placeholder="MM/AA" maxLength={5} />
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
                              <Input {...field} placeholder="123" maxLength={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-xs text-amber-700">
                          <p>Ceci est une démo. Utilisez le numéro de carte test:</p>
                          <code className="font-mono">4242 4242 4242 4242</code>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg">
                      <CreditCard className="mr-2 h-5 w-5" />
                      {auth.isAuthenticated 
                        ? `Payer ${clientTotal.toLocaleString('fr-FR')} XOF`
                        : `Se connecter et payer ${clientTotal.toLocaleString('fr-FR')} XOF`
                      }
                    </Button>
                  </CardContent>
                </form>
              </Form>
            </Card>
          )}
        </div>

        {/* Résumé de commande */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <img 
                  src={event.thumbnailUrl} 
                  alt={event.title}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{event.title}</h3>
                  <Badge variant="outline" className="mt-1">{event.category}</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {/* Détail des tickets */}
                {ticketDetails.map((detail, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{detail.ticket.name}</span>
                      <span>×{detail.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Prix unitaire</span>
                      <span>{detail.ticket.price.toLocaleString('fr-FR')} XOF</span>
                    </div>
                    {detail.quantity > 1 && (
                      <div className="flex justify-between text-sm">
                        <span>Sous-total</span>
                        <span>{detail.subtotal.toLocaleString('fr-FR')} XOF</span>
                      </div>
                    )}
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span>{isFree ? 'Gratuit' : `${clientTotal.toLocaleString('fr-FR')} XOF`}</span>
                </div>
                
                {!isFree && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Commission plateforme ({commissionRate}%)</span>
                      <span>-{adminCommission.toLocaleString('fr-FR')} XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenu promoteur</span>
                      <span>{promoterRevenue.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  </div>
                )}
              </div>

              {event.type === 'offline' && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-800 mb-1">Événement physique</p>
                  <p className="text-blue-700">
                    {selectedTickets.length > 1 
                      ? `${selectedTickets.reduce((sum, t) => sum + t.quantity, 0)} billets seront disponibles`
                      : 'Votre billet sera disponible'} 
                    en téléchargement après {isFree ? 'confirmation' : 'paiement'}.
                  </p>
                </div>
              )}

              {(event.type === 'live' || event.type === 'vod') && (
                <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded">
                  <p className="font-medium text-amber-800 mb-1">Événement en ligne</p>
                  <p className="text-amber-700">
                    Accès immédiat après {isFree ? 'confirmation' : 'paiement'}.
                  </p>
                </div>
              )}

              {auth.isAuthenticated && auth.profile && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium">Connecté en tant que :</p>
                  <p>{auth.profile.name || auth.user?.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}