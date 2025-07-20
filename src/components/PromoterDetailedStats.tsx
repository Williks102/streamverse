
"use client";

import type { AppEvent } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, BarChartHorizontalBig } from 'lucide-react';
import { getLowestPrice } from '@/lib/utils';
import Image from 'next/image';

interface PromoterDetailedStatsProps {
  events: AppEvent[];
}

// Mock data, in a real app this would come from a database query
const getMockEventStats = (event: AppEvent) => {
    const lowestPrice = getLowestPrice(event.tickets);
    // More tickets sold for cheaper/free events
    const ticketsSold = Math.floor(Math.random() * (lowestPrice > 0 ? 150 : 500)); 
    const ticketsScanned = event.type === 'offline' ? Math.floor(ticketsSold * (Math.random() * 0.5 + 0.4)) : 0; // 40-90% scanned
    const revenue = ticketsSold * lowestPrice;
    return { ticketsSold, ticketsScanned, revenue };
};

export default function PromoterDetailedStats({ events }: PromoterDetailedStatsProps) {

  if (!events || events.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig /> Statistiques par Événement</CardTitle>
                <CardDescription>Aucun événement trouvé pour afficher les statistiques.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig /> Statistiques par Événement</CardTitle>
        <CardDescription>
          Analysez les performances de chaque événement individuellement. Les données sont simulées.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Événement</TableHead>
                        <TableHead className="text-center">Billets Vendus</TableHead>
                        <TableHead className="text-center">Entrées Scannées</TableHead>
                        <TableHead className="text-right">Revenu Brut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map(event => {
                        const stats = getMockEventStats(event);
                        return (
                            <TableRow key={event.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Image src={event.thumbnailUrl} alt={event.title} width={64} height={36} className="rounded-md object-cover hidden sm:block" />
                                        <div>
                                            <p className="font-medium">{event.title}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-mono">{stats.ticketsSold}</TableCell>
                                <TableCell className="text-center font-mono">
                                    {event.type === 'offline' ? stats.ticketsScanned : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right font-mono">{stats.revenue.toLocaleString('fr-FR')} XOF</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        <Eye className="mr-2 h-4 w-4"/> Voir Rapport
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

