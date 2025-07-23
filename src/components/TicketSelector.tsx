// src/components/TicketSelector.tsx - VERSION AMÉLIORÉE
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Ticket, Plus, Minus, AlertCircle } from 'lucide-react';
import type { AppEvent, Ticket as TicketType } from '@/types';
import { cn } from '@/lib/utils';

interface TicketSelectorProps {
  event: AppEvent;
  onClose?: () => void;
}

interface SelectedTicket {
  ticketId: string;
  quantity: number;
}

export default function TicketSelector({ event, onClose }: TicketSelectorProps) {
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'événement a des tickets
  const tickets = event.tickets || [];
  
  if (tickets.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun ticket disponible pour cet événement.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mettre à jour la quantité d'un ticket
  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setError(null);
    
    if (quantity < 0) return;
    
    // Pour les événements en ligne, limiter à 1 ticket total
    if ((event.type === 'live' || event.type === 'vod') && quantity > 1) {
      setError("Les événements en ligne sont limités à 1 ticket par commande.");
      return;
    }
    
    setSelectedTickets(prev => {
      const existing = prev.find(t => t.ticketId === ticketId);
      
      if (quantity === 0) {
        // Retirer le ticket
        return prev.filter(t => t.ticketId !== ticketId);
      } else if (existing) {
        // Mettre à jour la quantité
        return prev.map(t => 
          t.ticketId === ticketId ? { ...t, quantity } : t
        );
      } else {
        // Pour les événements en ligne, remplacer toute sélection existante
        if (event.type === 'live' || event.type === 'vod') {
          return [{ ticketId, quantity: 1 }];
        }
        // Ajouter un nouveau ticket pour les événements physiques
        return [...prev, { ticketId, quantity }];
      }
    });
  };

  // Obtenir la quantité pour un ticket
  const getTicketQuantity = (ticketId: string): number => {
    return selectedTickets.find(t => t.ticketId === ticketId)?.quantity || 0;
  };

  // Calculer le total
  const calculateTotal = () => {
    return selectedTickets.reduce((total, selected) => {
      const ticket = tickets.find(t => t.id === selected.ticketId);
      return total + (ticket?.price || 0) * selected.quantity;
    }, 0);
  };

  // Calculer le nombre total de tickets
  const getTotalTickets = () => {
    return selectedTickets.reduce((total, selected) => total + selected.quantity, 0);
  };

  // Générer l'URL de checkout avec tous les tickets sélectionnés
  const getCheckoutUrl = () => {
    if (selectedTickets.length === 0) return '#';
    
    // Encoder les tickets sélectionnés dans l'URL
    const ticketsParam = encodeURIComponent(JSON.stringify(selectedTickets));
    return `/events/${event.id}/checkout?tickets=${ticketsParam}`;
  };

  const hasSelectedTickets = selectedTickets.length > 0;
  const total = calculateTotal();
  const totalTickets = getTotalTickets();
  const isOnlineEvent = event.type === 'live' || event.type === 'vod';

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Sélection de Billets
        </CardTitle>
        <CardDescription>
          {isOnlineEvent 
            ? `Sélectionnez votre accès pour "${event.title}"`
            : `Choisissez vos billets pour "${event.title}"`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Message d'erreur */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Liste des types de billets */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {isOnlineEvent ? 'Type d\'accès disponible' : 'Types de billets disponibles'}
          </h3>
          
          {tickets.map((ticket) => {
            const quantity = getTicketQuantity(ticket.id);
            const isFree = ticket.price === 0;
            const isSelected = quantity > 0;
            
            return (
              <div 
                key={ticket.id} 
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-colors",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{ticket.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isFree ? "secondary" : "default"}>
                        {isFree ? 'Gratuit' : `${ticket.price.toLocaleString('fr-FR')} XOF`}
                      </Badge>
                      {isOnlineEvent && (
                        <Badge variant="outline" className="text-xs">
                          Accès unique
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Sélecteur de quantité */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateTicketQuantity(ticket.id, quantity - 1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <span className="w-12 text-center font-semibold">
                      {quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateTicketQuantity(ticket.id, quantity + 1)}
                      disabled={isOnlineEvent && (quantity >= 1 || getTotalTickets() >= 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Sous-total pour ce ticket */}
                {quantity > 0 && (
                  <div className="text-sm text-muted-foreground flex justify-between pt-2 border-t">
                    <span>Sous-total</span>
                    <span className="font-medium">
                      {isFree ? 'Gratuit' : `${(ticket.price * quantity).toLocaleString('fr-FR')} XOF`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Résumé de la sélection */}
        {hasSelectedTickets && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Résumé de la commande</h4>
            <div className="space-y-2">
              {selectedTickets.map(selected => {
                const ticket = tickets.find(t => t.id === selected.ticketId);
                if (!ticket) return null;
                
                return (
                  <div key={selected.ticketId} className="flex justify-between text-sm">
                    <span>{ticket.name} × {selected.quantity}</span>
                    <span>{(ticket.price * selected.quantity).toLocaleString('fr-FR')} XOF</span>
                  </div>
                );
              })}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold">
                <span>Total ({totalTickets} billet{totalTickets > 1 ? 's' : ''})</span>
                <span>{total.toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          
          <Button
            asChild
            disabled={!hasSelectedTickets}
            className="flex-1"
            size="lg"
          >
            <Link href={hasSelectedTickets ? getCheckoutUrl() : '#'}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {total === 0 ? 'Réserver Gratuitement' : `Procéder au paiement (${total.toLocaleString('fr-FR')} XOF)`}
            </Link>
          </Button>
        </div>

        {/* Note informative */}
        {event.type === 'offline' && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Événement physique</p>
            <p className="text-blue-700">
              Vous pouvez acheter plusieurs types de billets. Ils seront disponibles 
              en téléchargement après le paiement.
            </p>
          </div>
        )}
        
        {isOnlineEvent && (
          <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg">
            <p className="font-medium text-amber-800 mb-1">Événement en ligne</p>
            <p className="text-amber-700">
              Un seul accès par commande. Pour plusieurs participants, 
              effectuez des commandes séparées.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}