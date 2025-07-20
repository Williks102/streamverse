
import { OrderService } from '@/services/orders';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Ticket as TicketIcon, User, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PrintableTicketPageProps {
  params: { orderId: string };
}

// A simple component to generate a mock QR code SVG
const MockQrCode = ({ value }: { value: string }) => (
    <div className="p-2 bg-white rounded-md">
        <svg width="200" height="200" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f0f0f0" />
            <text x="50" y="55" fontSize="8" textAnchor="middle" fill="#333">
                QR Code for:
            </text>
            <text x="50" y="65" fontSize="6" textAnchor="middle" fill="#555">
                {value}
            </text>
        </svg>
    </div>
);


export default async function PrintableTicketPage({ params }: PrintableTicketPageProps) {
  // In a real app, you would fetch a single order by its ID
  const allOrders = await OrderService.getAllOrders();
  const order = allOrders.find(o => o.id === params.orderId);

  if (!order) {
    notFound();
  }

  const { event, ticket, purchaseDate } = order;
  const formattedPurchaseDate = new Date(purchaseDate).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="bg-muted min-h-screen flex items-center justify-center p-4 print:bg-white">
        <Card className="w-full max-w-md shadow-2xl print:shadow-none print:border-none">
            <CardHeader className="text-center bg-primary text-primary-foreground p-4 rounded-t-lg">
                <CardTitle className="text-2xl flex items-center justify-center gap-2"><TicketIcon /> Billet Officiel</CardTitle>
                <CardDescription className="text-primary-foreground/80">Ceci est votre preuve d'achat</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="text-center">
                    <p className="text-muted-foreground">Événement</p>
                    <h2 className="text-2xl font-bold">{event.title}</h2>
                    <Badge variant="outline" className="mt-1">{event.category}</Badge>
                </div>
                
                <Separator />

                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-muted-foreground">Type de Billet</p>
                        <p className="font-bold text-lg">{ticket.name}</p>
                    </div>
                     <div className="text-right">
                        <p className="text-muted-foreground">Prix Payé</p>
                        <p className="font-bold text-lg">{ticket.price.toLocaleString('fr-FR')} XOF</p>
                    </div>
                </div>

                {event.type === 'offline' && (
                    <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-md">
                        {event.startTime && (
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-primary"/> 
                                <span>{new Date(event.startTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        )}
                        {event.startTime && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-primary"/> 
                                <span>{new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-primary"/> 
                                <span>{event.location}, {event.address}</span>
                            </div>
                        )}
                    </div>
                )}
                
                <Separator />
                
                <div className="flex flex-col items-center justify-center gap-4">
                     <p className="font-semibold">Présentez ce QR code à l'entrée</p>
                     <div className="p-2 border-4 border-dashed border-border rounded-xl">
                        {/* In a real app, you would use a library to generate a real QR code SVG */}
                        <MockQrCode value={order.id} />
                     </div>
                </div>

                <Separator/>

                 <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>ID de Commande: {order.id}</p>
                    <p>Acheté le: {formattedPurchaseDate}</p>
                    <p>Organisé par: {event.promoterInfo?.name || 'N/A'}</p>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
