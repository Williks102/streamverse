
"use client";

import { useState, useMemo, useTransition } from 'react';
import type { AppEvent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Ticket, Wallet, Percent, TrendingUp, HandCoins, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface PromoterStatsProps {
  events: AppEvent[];
}

const getLowestPrice = (tickets: AppEvent['tickets']): number => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((min, t) => t.price < min ? t.price : min, tickets[0].price);
};

export default function PromoterStats({ events }: PromoterStatsProps) {
  const [ticketPrice, setTicketPrice] = useState(10000);
  const [numTickets, setNumTickets] = useState(100);
  const [commissionPercentage, setCommissionPercentage] = useState(20);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.isPublished).length;
    // Mocked total tickets sold based on event prices
    const totalTicketsSold = events
      .filter(e => e.tickets && e.tickets.length > 0)
      .reduce((acc, e) => {
          const lowestPrice = getLowestPrice(e.tickets);
          return acc + (lowestPrice > 0 ? (150 - lowestPrice / 1000) : 50); // Simplified logic
      }, 0);
      
    const totalRevenue = events
      .filter(e => e.tickets && e.tickets.length > 0)
      .reduce((acc, e) => {
          const lowestPrice = getLowestPrice(e.tickets);
          const ticketsSold = lowestPrice > 0 ? (150 - lowestPrice / 1000) : 50;
          return acc + (lowestPrice * ticketsSold);
      }, 0);


    return {
      totalEvents,
      publishedEvents,
      totalTicketsSold: Math.floor(totalTicketsSold),
      totalRevenue: Math.floor(totalRevenue)
    };
  }, [events]);

  const simulation = useMemo(() => {
    const grossRevenue = ticketPrice * numTickets;
    const commission = grossRevenue * (commissionPercentage / 100);
    const netRevenue = grossRevenue - commission;
    return { grossRevenue, commission, netRevenue };
  }, [ticketPrice, numTickets, commissionPercentage]);
  

  const eventsByType = useMemo(() => {
      const data = [
          { name: 'Live', count: events.filter(e => e.type === 'live').length },
          { name: 'VOD', count: events.filter(e => e.type === 'vod').length },
          { name: 'Physique', count: events.filter(e => e.type === 'offline').length },
      ];
      return data;
  }, [events]);

  const handleRequestPayout = () => {
    startTransition(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: "Demande de paiement envoyée",
            description: "Votre demande de paiement a été envoyée à l'administrateur pour traitement.",
            className: "bg-green-600 text-white"
        })
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Stats Column */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 /> Statistiques Globales (Simulées)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Événements Créés</p>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Événements Publiés</p>
              <p className="text-2xl font-bold">{stats.publishedEvents}</p>
            </div>
             <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Billets Vendus</p>
              <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
            </div>
             <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Revenu Total</p>
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')} XOF</p>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp />Répartition des Événements</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={eventsByType} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                            }}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Nombre d'événements" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* Simulator & Payout Column */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet /> Simulateur de Revenus
            </CardTitle>
            <CardDescription>
              Estimez vos gains pour un événement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-price">Prix du billet (XOF)</Label>
                <Input
                  id="ticket-price"
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="num-tickets">Nombre de billets</Label>
                <Input
                  id="num-tickets"
                  type="number"
                  value={numTickets}
                  onChange={(e) => setNumTickets(Number(e.target.value))}
                  placeholder="100"
                />
              </div>
            </div>
             <div>
                <Label htmlFor="commission-rate">Commission de la plateforme (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                  placeholder="20"
                />
              </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Revenu Brut</span>
                <span className="font-bold text-lg">{simulation.grossRevenue.toLocaleString('fr-FR')} XOF</span>
              </div>
              <div className="flex justify-between items-center text-destructive">
                <span className="flex items-center gap-1"><Percent size={16} />Commission ({commissionPercentage}%)</span>
                <span className="font-bold text-lg">- {simulation.commission.toLocaleString('fr-FR')} XOF</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-green-500">
                <span className="font-bold text-xl">Votre Revenu Net</span>
                <span className="font-bold text-xl">{simulation.netRevenue.toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><HandCoins /> Paiements</CardTitle>
                <CardDescription>Demandez le paiement de vos gains.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                    <p className="text-muted-foreground">Disponible pour le paiement</p>
                    <p className="font-bold text-lg text-green-500">{simulation.netRevenue.toLocaleString('fr-FR')} XOF</p>
                </div>
                <Button className="w-full" onClick={handleRequestPayout} disabled={isPending || simulation.netRevenue <= 0}>
                     {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                        </>
                    ) : (
                        "Demander un paiement"
                    )}
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
