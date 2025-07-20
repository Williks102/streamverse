
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAdminStats, getSiteSettings } from '@/app/admin/dashboard/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Percent, Banknote, FileStack, ArrowRight } from 'lucide-react';

interface CommissionStats {
    totalRevenue: number;
    totalTicketsSold: number;
    commissionRate: number;
}

export default function AdminCommissionManagement() {
    const [stats, setStats] = useState<CommissionStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [adminStats, siteSettings] = await Promise.all([
                    getAdminStats(),
                    getSiteSettings()
                ]);
                setStats({
                    totalRevenue: adminStats.totalRevenue,
                    totalTicketsSold: adminStats.totalTicketsSold,
                    commissionRate: siteSettings.commissionRate,
                });
            } catch (error) {
                console.error("Failed to fetch commission data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const commissionEarned = useMemo(() => {
        if (!stats) return 0;
        return stats.totalRevenue * (stats.commissionRate / 100);
    }, [stats]);

    if (isLoading || !stats) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Percent />
                    Gestion des Commissions
                </CardTitle>
                <CardDescription>
                    Visualisez les revenus totaux et les commissions générées par la plateforme.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Banknote size={16}/> Revenu Total (Brut)</p>
                        <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')} XOF</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><FileStack size={16}/> Billets Vendus</p>
                        <p className="text-3xl font-bold">{stats.totalTicketsSold.toLocaleString('fr-FR')}</p>
                    </div>
                </div>

                <Card className="bg-background/50">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-muted-foreground">Taux de commission actuel</p>
                            <p className="text-4xl font-bold text-primary">{stats.commissionRate}%</p>
                        </div>
                        <ArrowRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                        <div className="flex-1 text-center md:text-right">
                             <p className="text-muted-foreground">Commissions Gagnées</p>
                             <p className="text-4xl font-bold text-green-500">{commissionEarned.toLocaleString('fr-FR')} XOF</p>
                        </div>
                    </CardContent>
                </Card>

                 <p className="text-xs text-muted-foreground text-center">
                    Le taux de commission peut être modifié dans l'onglet "Paramètres". Les commissions gagnées sont calculées sur la base du revenu total brut et du taux de commission actuel.
                </p>

            </CardContent>
        </Card>
    );
}
