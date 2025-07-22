// src/components/admin/AdminCommissionManagement.tsx - Version améliorée avec paramètres réels
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAdminStats } from '@/app/admin/dashboard/actions';
import { SettingsService, type SiteSettings } from '@/services/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Percent, Banknote, FileStack, ArrowRight, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommissionStats {
    totalRevenue: number;
    totalTicketsSold: number;
    commissionRate: number;
}

export default function AdminCommissionManagement() {
    const [stats, setStats] = useState<CommissionStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Fonction pour charger les données
    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // Récupérer les stats admin
            const adminStats = await getAdminStats();
            
            // Récupérer le taux de commission depuis le service (paramètres réels)
            const currentCommissionRate = SettingsService.getCommissionRate();
            
            setStats({
                totalRevenue: adminStats.totalRevenue,
                totalTicketsSold: adminStats.totalTicketsSold,
                commissionRate: currentCommissionRate,
            });
            
            setLastUpdated(new Date());
            console.log('✅ Données de commission chargées:', {
                revenue: adminStats.totalRevenue,
                tickets: adminStats.totalTicketsSold,
                rate: currentCommissionRate
            });
            
        } catch (error) {
            console.error("Failed to fetch commission data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Charger les données au montage
    useEffect(() => {
        fetchData();
    }, []);

    // Écouter les changements de commission en temps réel
    useEffect(() => {
        const handleCommissionUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ newRate: number }>;
            console.log('🔄 Commission mise à jour détectée:', customEvent.detail);
            
            // Mettre à jour immédiatement le taux dans les stats
            setStats(prevStats => {
                if (prevStats) {
                    return {
                        ...prevStats,
                        commissionRate: customEvent.detail.newRate
                    };
                }
                return prevStats;
            });
            
            setLastUpdated(new Date());
        };

        // Écouter les mises à jour de paramètres
        const unsubscribeSettings = SettingsService.onSettingsChange((newSettings: SiteSettings) => {
            console.log('🔄 Paramètres mis à jour détectés:', newSettings);
            setStats(prevStats => {
                if (prevStats) {
                    return {
                        ...prevStats,
                        commissionRate: newSettings.commissionRate
                    };
                }
                return prevStats;
            });
            setLastUpdated(new Date());
        });

        // Écouter les événements de commission
        window.addEventListener('commissionUpdated', handleCommissionUpdate);

        return () => {
            unsubscribeSettings();
            window.removeEventListener('commissionUpdated', handleCommissionUpdate);
        };
    }, []);

    // Calculer les commissions gagnées
    const commissionEarned = useMemo(() => {
        if (!stats) return 0;
        return SettingsService.calculateCommissionEarned(stats.totalRevenue);
    }, [stats]);

    // Calculer le revenu net pour les promoteurs
    const promoterRevenue = useMemo(() => {
        if (!stats) return 0;
        return stats.totalRevenue - commissionEarned;
    }, [stats, commissionEarned]);

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
        <div className="space-y-6">
            {/* En-tête avec statut */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900">Commissions en Temps Réel</h3>
                            <p className="text-blue-700 text-sm">
                                Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchData}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Statistiques principales */}
            <Card className="max-w-4xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent />
                        Gestion des Commissions
                    </CardTitle>
                    <CardDescription>
                        Visualisez les revenus totaux et les commissions générées par la plateforme avec les paramètres actuels.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Métriques générales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-600 flex items-center justify-center gap-2">
                                <Banknote size={16}/> Revenu Total (Brut)
                            </p>
                            <p className="text-3xl font-bold text-blue-900">
                                {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                            </p>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                <FileStack size={16}/> Billets Vendus
                            </p>
                            <p className="text-3xl font-bold text-gray-900">
                                {stats.totalTicketsSold.toLocaleString('fr-FR')}
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-600 flex items-center justify-center gap-2">
                                <TrendingUp size={16}/> Taux Actuel
                            </p>
                            <p className="text-3xl font-bold text-purple-900">
                                {stats.commissionRate}%
                            </p>
                        </div>
                    </div>

                    {/* Calcul des commissions */}
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-green-700 font-medium">Revenus Promoteurs</p>
                                <p className="text-3xl font-bold text-green-800">
                                    {promoterRevenue.toLocaleString('fr-FR')} XOF
                                </p>
                                <p className="text-sm text-green-600">
                                    ({(100 - stats.commissionRate).toFixed(1)}% du total)
                                </p>
                            </div>
                            
                            <ArrowRight className="h-8 w-8 text-green-600 hidden md:block" />
                            
                            <div className="flex-1 text-center md:text-right">
                                 <p className="text-emerald-700 font-medium">Commissions Plateforme</p>
                                 <p className="text-3xl font-bold text-emerald-800">
                                     {commissionEarned.toLocaleString('fr-FR')} XOF
                                 </p>
                                 <p className="text-sm text-emerald-600">
                                     ({stats.commissionRate}% du total)
                                 </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations importantes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Paramètres en temps réel</p>
                                <p>
                                    Le taux de commission peut être modifié dans l'onglet "Paramètres" et 
                                    les changements sont appliqués immédiatement sur toute la plateforme. 
                                    Les calculs ci-dessus utilisent le taux actuel de <strong>{stats.commissionRate}%</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques additionnelles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">Revenu moyen par billet</p>
                            <p className="text-lg font-bold">
                                {stats.totalTicketsSold > 0 
                                    ? (stats.totalRevenue / stats.totalTicketsSold).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                                    : '0'
                                } XOF
                            </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">Commission moyenne par billet</p>
                            <p className="text-lg font-bold">
                                {stats.totalTicketsSold > 0 
                                    ? (commissionEarned / stats.totalTicketsSold).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                                    : '0'
                                } XOF
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}