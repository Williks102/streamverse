
"use client";

import { useState, useEffect, useTransition } from 'react';
import { getPayoutRequests, processPayout } from '@/app/admin/dashboard/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type PayoutRequest = {
    id: string;
    promoterName: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
}

export default function AdminPayoutManagement() {
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        getPayoutRequests().then(data => {
            setRequests(data as PayoutRequest[]);
            setIsLoading(false);
        });
    }, []);

    const handleProcessPayout = (payoutId: string, action: 'approve' | 'reject') => {
        startTransition(async () => {
            const result = await processPayout(payoutId, action);
            if (result.success) {
                // For simulation, we just remove the request from the list.
                // In a real app, you might change its status.
                setRequests(prev => prev.filter(r => r.id !== payoutId));
                toast({ title: "Action réussie", description: result.message });
            } else {
                toast({ title: "Erreur", description: result.message, variant: "destructive" });
            }
        });
    };

    if (isLoading) {
        return <p>Chargement des demandes de paiement...</p>;
    }

    if (requests.length === 0) {
        return <p className="text-muted-foreground">Aucune demande de paiement en attente.</p>;
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Promoteur</TableHead>
                        <TableHead>Date de la demande</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(request => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.promoterName}</TableCell>
                            <TableCell>
                                {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true, locale: fr })}
                            </TableCell>
                            <TableCell className="font-mono">{request.amount.toLocaleString('fr-FR')} XOF</TableCell>
                            <TableCell>
                                <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                                    En attente
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                ) : (
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="Rejeter" onClick={() => handleProcessPayout(request.id, 'reject')} className="text-destructive hover:text-destructive">
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Approuver" onClick={() => handleProcessPayout(request.id, 'approve')} className="text-green-500 hover:text-green-500">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
