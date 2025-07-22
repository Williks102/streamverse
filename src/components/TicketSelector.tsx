// src/components/TicketSelector.tsx - Version corrigée sans erreurs TypeScript
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Ticket, Plus, Minus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import type { AppEvent } from '@/types';

interface TicketSelectorProps {
  event: AppEvent;
  onClose?: () => void;
}

interface TicketQuantity {
  ticketId: string;
  quantity: number;
}

export default function TicketSelector({ event, onClose }: TicketSelectorProps) {
  const [selectedTickets, setSelectedTickets] = useState<TicketQuantity[]>([]);

  // ✅ Vérifier que les tickets existent
  const tickets = event.tickets || [];
  
  if (tickets.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Aucun billet disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucun type de billet n'est disponible pour cet événement.
          </p>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Fermer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mettre à jour la quantité pour un billet
  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => {
      const existing = prev.find(t => t.ticketId === ticketId);
      
      if (quantity <= 0) {
        // Supprimer le billet si quantité = 0
        return prev.filter(t => t.ticketId !== ticketId);
      }
      
      if (existing) {
        // Mettre à jour la quantité existante
        return prev.map(t => 
          t.ticketId === ticketId ? { ...t, quantity } : t
        );
      } else {
        // Ajouter un nouveau billet
        return [...prev, { ticketId, quantity }];
      }
    });
  };

  // Obtenir la quantité pour un billet
  const getTicketQuantity = (ticketId: string): number => {
    return selectedTickets.find(t => t.ticketId === ticketId)?.quantity || 0;
  };

  // ✅ Calculer le total de manière sécurisée
  const calculateTotal = () => {
    return selectedTickets.reduce((total, selected) => {
      const ticket = tickets.find(t => t.id === selected.ticketId);
      return total + (ticket?.price || 0) * selected.quantity;
    }, 0);
  };

  // Calculer le nombre total de billets
  const getTotalTickets = () => {
    return selectedTickets.reduce((total, selected) => total + selected.quantity, 0);
  };

  // Générer l'URL de checkout avec les billets sélectionnés
  const getCheckoutUrl = () => {
    if (selectedTickets.length === 0) return '#';
    
    // Pour simplicité, on utilise le premier billet sélectionné
    const firstSelected = selectedTickets[0];
    return `/events/${event.id}/checkout?ticketTypeId=${firstSelected.ticketId}&quantity=${firstSelected.quantity}`;
  };

  const hasSelectedTickets = selectedTickets.length > 0;
  const total = calculateTotal();
  const totalTickets = getTotalTickets();

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Sélection de Billets
        </CardTitle>
        <CardDescription>
          Choisissez vos billets pour "{event.title}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Liste des types de billets */}
        <div className="space-y-4">
          <h3 className="font-semibold">Types de billets disponibles</h3>
          
          {tickets.map((ticket) => {
            const quantity = getTicketQuantity(ticket.id);
            const isFree = ticket.price === 0;
            
            return (
              <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{ticket.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isFree ? "secondary" : "default"}>
                        {isFree ? 'Gratuit' : `${ticket.price.toLocaleString('fr-FR')} XOF`}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Sélecteur de quantité */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateTicketQuantity(ticket.id, Math.max(0, quantity - 1))}
                      disabled={quantity <= 0}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-12 text-center">
                      <span className="font-medium">{quantity}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateTicketQuantity(ticket.id, quantity + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {quantity > 0 && (
                  <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                    <span className="text-green-700">
                      {quantity} × {ticket.name}
                    </span>
                    <span className="font-medium text-green-800">
                      {(ticket.price * quantity).toLocaleString('fr-FR')} XOF
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Résumé de la commande */}
        {hasSelectedTickets && (
          <div className="space-y-4">
            <Separator />
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Résumé de votre commande</h3>
              
              <div className="space-y-2">
                {selectedTickets.map((selected) => {
                  const ticket = tickets.find(t => t.id === selected.ticketId);
                  if (!ticket) return null;
                  
                  return (
                    <div key={selected.ticketId} className="flex justify-between text-sm">
                      <span>{selected.quantity} × {ticket.name}</span>
                      <span>{(ticket.price * selected.quantity).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  );
                })}
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>Total ({totalTickets} billet{totalTickets > 1 ? 's' : ''})</span>
                  <span>{total.toLocaleString('fr-FR')} XOF</span>
                </div>
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

        {/* Note pour événements physiques */}
        {event.type === 'offline' && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">Événement physique</p>
            <p className="text-blue-700">
              Vos billets seront disponibles en téléchargement après le paiement. 
              Présentez-les à l'entrée de l'événement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}