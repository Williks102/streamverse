// src/app/promoter/events/new/page.tsx - FORMULAIRE COMPLET AVEC AUTH
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Film, Mic, Tag, FileText as FileTextIcon, CalendarDays, RadioTower, Loader2, Save, Shield, MapPin, Trash, PlusCircle, Ticket, Upload } from 'lucide-react';
import { createEventAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useAuthClient } from '@/hooks/useAuthClient'; // ✅ Nouveau hook
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useRef, useEffect } from 'react';

const ticketSchema = z.object({
  name: z.string().min(1, { message: "Le nom du billet est requis." }),
  price: z.coerce.number().min(0, { message: "Le prix doit être un nombre positif." }),
});

const formSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit comporter au moins 3 caractères." }),
  description: z.string().min(10, { message: "La description doit comporter au moins 10 caractères." }),
  category: z.string().min(2, { message: "La catégorie est requise." }),
  type: z.enum(['live', 'vod', 'offline'], { required_error: "Veuillez sélectionner un type d'événement." }),
  isPublished: z.boolean().default(false),
  thumbnailUrl: z.string().min(1, { message: "Veuillez téléverser une image de miniature." }),
  tickets: z.array(ticketSchema).min(1, { message: "Vous devez proposer au moins un type de billet." }),
  videoSrc: z.string().url({ message: "Veuillez entrer une URL de vidéo valide." }).optional().or(z.literal('')),
  startTime: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
}).refine(data => {
    if ((data.type === 'live' || data.type === 'offline') && !data.startTime) {
        return false;
    }
    return true;
}, {
    message: "L'heure de début est requise pour les événements en direct ou hors ligne.",
    path: ["startTime"],
}).refine(data => {
    if (data.type === 'vod' && !data.videoSrc) {
        return false;
    }
    return true;
}, {
    message: "L'URL de la source vidéo est requise pour les VODs.",
    path: ["videoSrc"],
}).refine(data => {
    if (data.type === 'offline' && !data.location) {
        return false;
    }
    return true;
}, {
    message: "Le lieu est requis pour les événements hors ligne.",
    path: ["location"],
});

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ Utiliser le hook d'authentification côté client
  const auth = useAuthClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      type: 'vod',
      isPublished: false,
      thumbnailUrl: "https://placehold.co/600x400.png",
      tickets: [{ name: "Accès standard", price: 5000 }],
      videoSrc: "",
      startTime: "",
      location: "",
      address: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tickets",
  });

  const eventType = form.watch('type');
  const thumbnailUrl = form.watch('thumbnailUrl');

  // ✅ Vérifier l'authentification au chargement
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour créer un événement",
          variant: "destructive"
        });
        router.push('/auth/login');
      } else if (!auth.isPromoter) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être promoteur pour créer un événement",
          variant: "destructive"
        });
        router.push('/promoter/dashboard');
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isPromoter, router, toast]);

  // ✅ Ajuster les billets selon le type d'événement
  useEffect(() => {
    if (eventType === 'live' || eventType === 'vod') {
      const ticketsValue = form.getValues('tickets');
      if (ticketsValue.length > 1) {
        replace([ticketsValue[0]]);
      } else if (ticketsValue.length === 0) {
        replace([{ name: "Accès en ligne", price: 5000 }]);
      }
    }
  }, [eventType, form, replace]);

  // ✅ Gérer l'upload de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('thumbnailUrl', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Nouvelle fonction de soumission avec auth client
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log('📝 [CLIENT] Début soumission formulaire...');

      // Vérifier l'authentification
      if (!auth.isAuthenticated || !auth.isPromoter) {
        throw new Error('Vous devez être connecté en tant que promoteur');
      }

      // Récupérer les infos utilisateur pour l'action serveur
      const userInfo = auth.getUserInfoForServerAction();
      console.log('👤 [CLIENT] Infos utilisateur:', userInfo);

      // Appeler l'action serveur avec les infos utilisateur
      console.log('🚀 [CLIENT] Appel de l\'action serveur...');
      const result = await createEventAction(values, userInfo);

      console.log('✅ [CLIENT] Résultat:', result);

      toast({
        title: "Événement créé !",
        description: result.message || "Votre nouvel événement a été ajouté à votre tableau de bord.",
      });

      router.push('/promoter/dashboard');
    } catch (error) {
      console.error('❌ [CLIENT] Erreur:', error);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la création de l'événement.",
        variant: "destructive",
      });
    }
  }

  // ✅ Affichage de loading pendant l'authentification
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // ✅ Ne pas afficher le formulaire si pas authentifié
  if (!auth.isAuthenticated || !auth.isPromoter) {
    return null; // Le useEffect va rediriger
  }

  return (
    <div className="space-y-8">
      {/* Bouton de retour */}
      <Button variant="outline" asChild>
        <Link href="/promoter/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Button>

      {/* Afficher les infos de l'utilisateur connecté */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800">✅ Authentifié</h3>
        <p className="text-green-700">
          Connecté en tant que : <strong>{auth.profile?.name || auth.user?.email}</strong> ({auth.profile?.role})
        </p>
      </div>

      {/* Formulaire principal */}
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Film /> Créer un nouvel événement
          </CardTitle>
          <CardDescription>Remplissez les détails de votre nouvel événement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Titre */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FileTextIcon size={16} /> Titre de l'événement
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Mon Super Webinaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FileTextIcon size={16} /> Description
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez votre événement..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type et Catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <RadioTower size={16} /> Type d'événement
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="live">Live Stream</SelectItem>
                          <SelectItem value="vod">VOD (Video on Demand)</SelectItem>
                          <SelectItem value="offline">Événement physique</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Tag size={16} /> Catégorie
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Technologie, Marketing..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image miniature */}
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Upload size={16} /> Image de miniature
                    </FormLabel>
                    <div className="space-y-4">
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="URL de l'image ou uploadez un fichier" 
                          {...field} 
                        />
                      </FormControl>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Uploader une image
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      {thumbnailUrl && (
                        <div className="relative w-full max-w-xs mx-auto">
                          <Image
                            src={thumbnailUrl}
                            alt="Prévisualisation"
                            width={300}
                            height={200}
                            className="rounded-lg border object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champs conditionnels selon le type */}
              {eventType === 'vod' && (
                <FormField
                  control={form.control}
                  name="videoSrc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Film size={16} /> URL de la source vidéo (pour VOD)
                      </FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://exemple.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(eventType === 'live' || eventType === 'offline') && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <CalendarDays size={16} /> Date et heure de début
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {eventType === 'offline' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin size={16} /> Lieu
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Palais des Congrès" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin size={16} /> Adresse complète
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Adresse complète du lieu..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Billets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold flex items-center gap-1.5">
                    <Ticket size={16} /> Types de billets
                  </FormLabel>
                  {eventType === 'offline' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ name: "", price: 0 })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Ajouter un billet
                    </Button>
                  )}
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`tickets.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nom du billet</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: VIP, Standard..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`tickets.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>Prix (XOF)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5000" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {eventType === 'offline' && fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Publication */}
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-1.5">
                        <Shield size={16} /> Publier immédiatement
                      </FormLabel>
                      <FormDescription>
                        L'événement sera visible publiquement dès sa création
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Bouton de soumission */}
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting} 
                className="w-full" 
                size="lg"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer l'événement
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}