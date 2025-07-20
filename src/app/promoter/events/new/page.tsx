
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
  // Online fields
  videoSrc: z.string().url({ message: "Veuillez entrer une URL de vidéo valide." }).optional().or(z.literal('')),
  startTime: z.string().optional(),
  // Offline fields
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
}).refine(data => {
    if ((data.type === 'live' || data.type === 'vod') && data.tickets.length > 1) {
        return false;
    }
    return true;
}, {
    message: "Les événements en ligne ne peuvent avoir qu'un seul type de billet.",
    path: ["tickets"],
});


export default function CreateNewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      isPublished: false,
      thumbnailUrl: "",
      tickets: [{ name: "Standard", price: 10000 }],
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
  
  useEffect(() => {
    if (eventType === 'live' || eventType === 'vod') {
      if (fields.length > 1) {
        // Enforce a single ticket for online events
        replace([fields[0]]);
      }
      if (fields.length === 0) {
        append({ name: "Accès en ligne", price: 10000 });
      }
    }
  }, [eventType, fields, replace, append]);


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


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createEventAction(values);
      toast({
        title: "Événement créé !",
        description: "Votre nouvel événement a été ajouté à votre tableau de bord.",
      });
      router.push('/promoter/dashboard');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création de l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }


  return (
    <div className="space-y-8">
      <Button variant="outline" asChild>
        <Link href="/promoter/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Button>

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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><FileTextIcon size={16} /> Titre de l'événement</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Mon Super Webinaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><FileTextIcon size={16} /> Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez votre événement..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Tag size={16} /> Catégorie</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Technologie, Musique" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><RadioTower size={16} /> Type d'événement</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="live"><Mic className="mr-2 h-4 w-4"/> Live Stream</SelectItem>
                          <SelectItem value="vod"><Film className="mr-2 h-4 w-4"/> VOD</SelectItem>
                          <SelectItem value="offline"><MapPin className="mr-2 h-4 w-4"/> Événement Physique</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Film size={16} /> Miniature de l'événement</FormLabel>
                      <FormControl>
                          <div className="flex items-center gap-4">
                              <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                              />
                              <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                              >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Téléverser une image
                              </Button>
                              {thumbnailUrl ? (
                                  <Image 
                                      src={thumbnailUrl} 
                                      alt="Aperçu de la miniature" 
                                      width={160} 
                                      height={90} 
                                      className="aspect-video rounded-md object-cover"
                                  />
                              ) : (
                                  <div className="w-40 h-[90px] bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                      Aperçu
                                  </div>
                              )}
                          </div>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />


                <Separator />

                <div>
                  <FormLabel className="text-lg font-semibold flex items-center gap-1.5 mb-4">
                    <Ticket size={16} /> Billetterie
                  </FormLabel>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end p-4 border rounded-lg bg-muted/50">
                        <FormField
                          control={form.control}
                          name={`tickets.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du billet</FormLabel>
                              <FormControl><Input placeholder="ex: Billet Standard" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`tickets.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix (XOF)</FormLabel>
                              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {eventType === 'offline' && (
                         <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {eventType === 'offline' && (
                   <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: '', price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un type de billet
                  </Button>
                  )}
                  <FormMessage>{form.formState.errors.tickets?.message || form.formState.errors.tickets?.root?.message}</FormMessage>
                </div>


              {eventType === 'vod' && (
                <FormField
                  control={form.control}
                  name="videoSrc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5"><Film size={16} /> URL de la source vidéo (pour VOD)</FormLabel>
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
                      <FormLabel className="flex items-center gap-1.5"><CalendarDays size={16} /> Date et heure de début</FormLabel>
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
                        <FormLabel className="flex items-center gap-1.5"><MapPin size={16} /> Lieu</FormLabel>
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
                        <FormLabel className="flex items-center gap-1.5"><MapPin size={16} /> Adresse</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: 123 Rue de la République, 75001 Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              )}


              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-1.5"><Shield size={16} /> Statut de Publication</FormLabel>
                      <FormDescription>
                        Rendre l'événement visible publiquement sur le site.
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
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : 'Créer l\'événement'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    