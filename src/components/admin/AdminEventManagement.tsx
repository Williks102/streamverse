
"use client";

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AppEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAllEventsForAdmin, toggleEventPublishStatus, deleteEvent } from '@/app/admin/dashboard/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function AdminEventManagement() {
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        getAllEventsForAdmin().then(data => {
            setEvents(data);
            setIsLoading(false);
        });
    }, []);

    const handleTogglePublish = (eventId: string, currentStatus: boolean) => {
        startTransition(async () => {
            try {
                await toggleEventPublishStatus(eventId);
                setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isPublished: !e.isPublished } : e));
                toast({
                    title: "Statut mis à jour",
                    description: `L'événement est maintenant ${!currentStatus ? 'publié' : 'non publié'}.`,
                });
            } catch (error) {
                toast({ title: "Erreur", description: "La mise à jour a échoué.", variant: "destructive" });
            }
        });
    };
    
    const handleDeleteEvent = (eventId: string) => {
        startTransition(async () => {
            try {
                await deleteEvent(eventId);
                setEvents(prev => prev.filter(e => e.id !== eventId));
                toast({
                    title: "Événement supprimé",
                    description: "L'événement a été supprimé avec succès.",
                });
            } catch (error) {
                toast({ title: "Erreur", description: "La suppression a échoué.", variant: "destructive" });
            }
        });
    }

    if (isLoading) {
        return <p>Chargement des événements...</p>;
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Événement</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Promoteur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map(event => (
                        <TableRow key={event.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Image src={event.thumbnailUrl} alt={event.title} width={80} height={45} className="rounded-md object-cover" />
                                    <div>
                                        <p className="font-medium">{event.title}</p>
                                        <p className="text-sm text-muted-foreground">{event.category}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{event.type.toUpperCase()}</Badge></TableCell>
                            <TableCell>{event.promoterInfo?.name || 'N/A'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <Switch
                                        checked={event.isPublished}
                                        onCheckedChange={() => handleTogglePublish(event.id, event.isPublished)}
                                        disabled={isPending}
                                        aria-label="Toggle event publication"
                                    />
                                    <span className="text-sm">{event.isPublished ? 'Publié' : 'Brouillon'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild variant="ghost" size="icon" title="Voir l'événement">
                                        <Link href={event.type === 'live' ? `/live/${event.id}` : event.type === 'vod' ? `/vod/${event.id}` : `/offline/${event.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="ghost" size="icon" title="Modifier">
                                        <Link href={`/promoter/events/${event.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive hover:text-destructive">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible. L'événement "{event.title}" sera définitivement supprimé.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Supprimer
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
