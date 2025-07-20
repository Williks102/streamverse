
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, KeyRound, Loader2, Mail, Save, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getPaymentMethods, removePaymentMethod, updateLoginInfo, updateUserPassword } from "@/app/account/actions";
import { useEffect, useState, useTransition } from "react";

const loginInfoSchema = z.object({
  email: z.string().email({ message: "L'adresse e-mail est invalide." }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Le mot de passe actuel est requis." }),
    newPassword: z.string().min(8, { message: "Le nouveau mot de passe doit comporter au moins 8 caractères." }),
});

type PaymentMethod = {
    id: string;
    type: string;
    last4: string;
    isDefault: boolean;
};

export default function AccountSettings() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    const loginForm = useForm<z.infer<typeof loginInfoSchema>>({
        resolver: zodResolver(loginInfoSchema),
        defaultValues: { email: "user@example.com" }, // Mock data
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", newPassword: "" },
    });
    
    useEffect(() => {
        getPaymentMethods().then(setPaymentMethods);
    }, [])

    const onLoginInfoSubmit = (values: z.infer<typeof loginInfoSchema>) => {
        startTransition(async () => {
            const result = await updateLoginInfo(values);
            toast({
                title: result.success ? "Succès" : "Erreur",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
        });
    };

    const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
        startTransition(async () => {
            const result = await updateUserPassword(values);
            toast({
                title: result.success ? "Succès" : "Erreur",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
             if (result.success) {
                passwordForm.reset();
            }
        });
    };
    
    const handleRemoveCard = (id: string) => {
        startTransition(async () => {
            const result = await removePaymentMethod(id);
            if(result.success) {
                setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
            }
            toast({
                title: result.success ? "Succès" : "Erreur",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
        });
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail />Informations de Connexion</CardTitle>
                    <CardDescription>Gérez votre adresse e-mail et votre mot de passe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginInfoSubmit)} className="space-y-4">
                            <FormField
                                control={loginForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse e-mail</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Enregistrer l'e-mail
                            </Button>
                        </form>
                    </Form>

                    <Separator />

                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                             <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe actuel</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nouveau mot de passe</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                Changer le mot de passe
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard />Informations de Paiement</CardTitle>
                    <CardDescription>Gérez vos moyens de paiement enregistrés.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {paymentMethods.length > 0 ? (
                        paymentMethods.map(card => (
                            <div key={card.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-6 w-6"/>
                                    <div>
                                        <p className="font-medium">{card.type} se terminant par {card.last4}</p>
                                        {card.isDefault && <p className="text-xs text-muted-foreground">Défaut</p>}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveCard(card.id)} disabled={isPending}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                    <span className="sr-only">Supprimer</span>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">Aucun moyen de paiement enregistré.</p>
                    )}
                     <Button variant="outline" className="mt-4" disabled={isPending}>Ajouter un nouveau moyen de paiement</Button>
                </CardContent>
            </Card>
        </div>
    )
}
