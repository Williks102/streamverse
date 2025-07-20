
"use client";

import { useState, useEffect } from 'react';
import { getAdminStats } from '@/app/admin/dashboard/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clapperboard, Ticket, Banknote } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AdminStatsData {
    totalEvents: number;
    totalUsers: number;
    totalRevenue: number;
    totalTicketsSold: number;
}

export default function AdminStats() {
    const [stats, setStats] = useState<AdminStatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAdminStats().then(data => {
            setStats(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading || !stats) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-3/4 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const statCards = [
        { title: "Revenu Total", value: `${stats.totalRevenue.toLocaleString('fr-FR')} XOF`, icon: Banknote, description: "Revenu brut total" },
        { title: "Billets Vendus", value: stats.totalTicketsSold.toLocaleString('fr-FR'), icon: Ticket, description: "Sur toute la plateforme" },
        { title: "Événements Totaux", value: stats.totalEvents, icon: Clapperboard, description: "Live, VOD, et physiques" },
        { title: "Utilisateurs Inscrits", value: stats.totalUsers, icon: Users, description: "Utilisateurs et promoteurs" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
