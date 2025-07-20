
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, deleteUser } from '@/app/admin/dashboard/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash } from 'lucide-react';
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

type User = {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'promoter';
    totalSpent: number;
}

export default function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        getAllUsers().then(data => {
            setUsers(data as User[]);
            setIsLoading(false);
        });
    }, []);
    
    const handleDeleteUser = (userId: string) => {
        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.success) {
                // In a real app, the user would be removed from the list.
                // Here we just show a toast due to mock implementation.
                toast({ title: "Action simulée", description: result.message });
            } else {
                 toast({ title: "Erreur", description: result.message, variant: 'destructive' });
            }
        });
    }

    if (isLoading) {
        return <p>Chargement des utilisateurs...</p>;
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Total Dépensé</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'promoter' ? 'default' : 'secondary'}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>{user.totalSpent.toLocaleString('fr-FR')} XOF</TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive hover:text-destructive" disabled={isPending}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible. L'utilisateur "{user.name}" sera supprimé (simulation).
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                                Confirmer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
