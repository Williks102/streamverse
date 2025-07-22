// src/components/admin/AdminCommissionManagement.tsx - Nouvelle logique de commission
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getAdminStats } from '@/app/admin/dashboard/actions';
import { SettingsService, type SiteSettings } from '@/services/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Percent, Banknote, FileStack, ArrowRight, RefreshCw, TrendingUp, Loader2, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommissionStats {
    totalRevenue: number;
    totalTicketsSold: number;
    commissionRate: number;
    totalUsers: number;
}

export default function AdminCommissionManagement() {
    const [stats, setStats] = useState<CommissionStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isMounted, setIsMounted] = useState(false);

    // Attendre le montage côté client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fonction pour charger les données
    const fetchData = async () => {
        if (!isMounted) return;
        
        try {
            setIsLoading(true);
            
            // Récupérer les stats admin
            const adminStats = await getAdminStats();
            
            // ✅ Récupérer le taux de commission depuis localStorage (côté client)
            const currentCommissionRate = SettingsService.getCommissionRate();
            
            setStats({
                totalRevenue: adminStats.totalRevenue,
                totalTicketsSold: adminStats.totalTicketsSold,
                totalUsers: adminStats.totalUsers,
                commissionRate: currentCommissionRate,
            });
            
            setLastUpdated(new Date());
            console.log('✅ Données de commission chargées:', {
                revenue: adminStats.totalRevenue,
                tickets: adminStats.totalTicketsSold,
                users: adminStats.totalUsers,
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
        if (isMounted) {
            fetchData();
        }
    }, [isMounted]);

    // ✅ Écouter les changements de commission en temps réel
    useEffect(() => {
        if (!isMounted) return;

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

        // Écouter les mises à jour de paramètres depuis SettingsService
        const unsubscribeSettings = SettingsService.onSettingsChange((newSettings: SiteSettings) => {
            console.log('🔄 Paramètres mis à jour détectés depuis localStorage:', newSettings);
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

        // Écouter les événements de commission depuis AdminSettings
        window.addEventListener('commissionUpdated', handleCommissionUpdate);

        return () => {
            unsubscribeSettings();
            window.removeEventListener('commissionUpdated', handleCommissionUpdate);
        };
    }, [isMounted]);

    // ✅ Calculer les commissions avec la nouvelle logique
    const commissionEarned = useMemo(() => {
        if (!stats || !isMounted) return 0;
        // Commission = revenus client × taux commission
        return stats.totalRevenue * (stats.commissionRate / 100);
    }, [stats, isMounted]);

    // ✅ Calculer le revenu net des promoteurs
    const promoterRevenue = useMemo(() => {
        if (!stats) return 0;
        // Promoteurs reçoivent : revenus client - commission admin
        return stats.totalRevenue - commissionEarned;
    }, [stats, commissionEarned]);

    // Afficher un loader pendant le montage
    if (!isMounted) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Chargement des commissions...</span>
                    </div>
                </CardHeader>
            </Card>
        );
    }

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
                            <h3 className="text-lg font-semibold text-blue-900">Commission Déduite Côté Promoteur</h3>
                            <p className="text-blue-700 text-sm">
                                Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
                            </p>
                            <p className="text-blue-600 text-xs">
                                Le client paie le prix affiché, la commission est déduite du promoteur
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

            {/* Métriques principales */}
            <Card className="max-w-6xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent />
                        Gestion des Commissions - Modèle Réel
                    </CardTitle>
                    <CardDescription>
                        Vision complète des revenus clients, commissions déduites et revenus nets promoteurs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Métriques générales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-600 flex items-center justify-center gap-2">
                                <DollarSign size={16}/> Revenus Clients (Payé)
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                                {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                            </p>
                            <p className="text-xs text-blue-600 mt-1">Prix affiché × quantité</p>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                <FileStack size={16}/> Billets Vendus
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.totalTicketsSold.toLocaleString('fr-FR')}
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                                <Users size={16}/> Utilisateurs
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                                {stats.totalUsers.toLocaleString('fr-FR')}
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-600 flex items-center justify-center gap-2">
                                <TrendingUp size={16}/> Taux Commission
                            </p>
                            <p className="text-2xl font-bold text-purple-900">
                                {stats.commissionRate}%
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                                (déduit côté promoteur)
                            </p>
                        </div>
                    </div>

                    {/* ✅ Flux de revenus corrigé */}
                    <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                        <CardContent className="p-6">
                            <h4 className="text-lg font-semibold mb-4 text-center text-emerald-800">
                                Flux de Revenus - Modèle Réel
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                {/* Clients paient */}
                                <div className="text-center">
                                    <div className="bg-blue-100 rounded-full p-4 mb-3 mx-auto w-fit">
                                        <DollarSign className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <p className="text-blue-800 font-medium">Clients Paient</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                                    </p>
                                    <p className="text-xs text-blue-600">Prix affiché du billet</p>
                                </div>
                                
                                <ArrowRight className="h-8 w-8 text-emerald-600 mx-auto" />
                                
                                {/* Répartition */}
                                <div className="space-y-4">
                                    {/* Commission Admin */}
                                    <div className="bg-red-100 p-3 rounded-lg text-center">
                                        <p className="text-red-700 font-medium text-sm">Commission Plateforme</p>
                                        <p className="text-lg font-bold text-red-800">
                                            {commissionEarned.toLocaleString('fr-FR')} XOF
                                        </p>
                                        <p className="text-xs text-red-600">({stats.commissionRate}% déduits)</p>
                                    </div>
                                    
                                    {/* Revenus Promoteur */}
                                    <div className="bg-green-100 p-3 rounded-lg text-center">
                                        <p className="text-green-700 font-medium text-sm">Revenus Promoteur</p>
                                        <p className="text-lg font-bold text-green-800">
                                            {promoterRevenue.toLocaleString('fr-FR')} XOF
                                        </p>
                                        <p className="text-xs text-green-600">({(100 - stats.commissionRate)}% reçus)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Exemple concret */}
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardHeader>
                            <CardTitle className="text-yellow-800 text-lg">Exemple Concret</CardTitle>
                        </CardHeader>
                        <CardContent className="text-yellow-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="font-medium">🎫 Billet à 10,000 XOF</p>
                                    <p>• Client paie : <strong>10,000 XOF</strong></p>
                                    <p>• (Prix affiché exactement)</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="font-medium">📊 Commission {stats.commissionRate}%</p>
                                    <p>• Admin reçoit : <strong>{(10000 * stats.commissionRate / 100).toLocaleString('fr-FR')} XOF</strong></p>
                                    <p>• (Déduit automatiquement)</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="font-medium">💰 Promoteur reçoit</p>
                                    <p>• Net : <strong>{(10000 * (100 - stats.commissionRate) / 100).toLocaleString('fr-FR')} XOF</strong></p>
                                    <p>• ({100 - stats.commissionRate}% du prix)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistiques complémentaires */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">Revenu moyen par billet (client)</p>
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