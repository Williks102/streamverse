
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Lock, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEventById } from '@/lib/data';
import { useEffect, useState, useMemo } from 'react';
import type { AppEvent } from '@/types';
import { Separator } from '@/components/ui/separator';
import { processCheckoutAction } from './actions';

const paymentSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
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
  const ticketTypeId = searchParams.get('ticketTypeId');

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

  useEffect(() => {
    async function fetchEvent() {
      if (eventId) {
        const foundEvent = await getEventById(eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          router.push('/'); // Redirect if event not found
        }
      }
    }
    fetchEvent();
  }, [eventId, router]);

  const selectedTicket = useMemo(() => {
    if (!event || !ticketTypeId) return event?.tickets[0]; // Default to first ticket if none selected
    return event.tickets.find(t => t.id === ticketTypeId);
  }, [event, ticketTypeId]);

  async function onSubmit(values: z.infer<typeof paymentSchema>) {
    if (!event || !selectedTicket) return;

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await processCheckoutAction({
        email: values.email,
        eventId: event.id,
        ticketId: selectedTicket.id,
      });

      if (result.success) {
        toast({
          title: "Paiement réussi !",
          description: `Votre accès pour "${event?.title}" a été confirmé.`,
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

  if (!event || !selectedTicket) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const backLink = event.type === 'live' ? `/live/${event.id}` : event.type === 'vod' ? `/vod/${event.id}`: `/offline/${event.id}`;
  const price = selectedTicket.price;
  const tax = price * 0.20; // Example 20% tax
  const total = price + tax;

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
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <CreditCard /> Paiement sécurisé
                    </CardTitle>
                    <CardDescription>Finalisez votre achat pour accéder à l'événement.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adresse e-mail</FormLabel>
                                    <FormControl><Input placeholder="votre.email@exemple.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Separator />
                            <h3 className="font-semibold text-lg">Informations de paiement</h3>
                             <FormField
                                control={form.control}
                                name="cardName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom sur la carte</FormLabel>
                                    <FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="•••• •••• •••• ••••" {...field} /></FormControl>
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
                                        <FormLabel>Expiration (MM/AA)</FormLabel>
                                        <FormControl><Input placeholder="MM/AA" {...field} /></FormControl>
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
                                        <FormControl><Input placeholder="•••" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Paiement en cours...
                                </>
                                ) : (
                                <><Lock className="mr-2 h-4 w-4" /> Payer {total.toLocaleString('fr-FR')} XOF</>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart /> Résumé de la commande
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Image src={event.thumbnailUrl} alt={event.title} width={80} height={45} className="rounded-md aspect-video object-cover" data-ai-hint="event poster" />
                        <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.category}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Billet: {selectedTicket.name}</span>
                            <span>{price.toLocaleString('fr-FR')} XOF</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TVA (20%)</span>
                            <span>{tax.toLocaleString('fr-FR')} XOF</span>
                        </div>
                    </div>
                    <Separator />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{total.toLocaleString('fr-FR')} XOF</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
