
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, CameraOff, Ticket, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useZxing } from 'react-zxing';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AppEvent, TicketType } from '@/types';
import { getEventById } from '@/lib/data';
import { Separator } from '@/components/ui/separator';


type ScanResultStatus = 'success' | 'error' | 'idle' | 'scanning';

interface ValidatedTicketInfo {
    event: AppEvent;
    ticket?: TicketType;
}

export default function ScannerPage() {
  const { toast } = useToast();
  const [scanResultStatus, setScanResultStatus] = useState<ScanResultStatus>('idle');
  const [validatedInfo, setValidatedInfo] = useState<ValidatedTicketInfo | null>(null);
  const [manualTicketId, setManualTicketId] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const resetScanner = () => {
    setScanResultStatus('scanning');
    setValidatedInfo(null);
    setManualTicketId('');
  };

  // Mock validation logic: assumes QR code contains event ID.
  // In a real app, this would be a unique ticket ID to look up.
  const processValidation = async (scannedValue: string | null) => {
    if (!scannedValue) {
        setScanResultStatus('error');
        toast({
            title: "Billet Invalide",
            description: "Le code QR ou l'ID est vide.",
            variant: "destructive",
        });
        setTimeout(() => resetScanner(), 4000);
        return;
    }

    const event = await getEventById(scannedValue);

    if (event) {
        setValidatedInfo({ event });
        setScanResultStatus('success');
        toast({
            title: "Billet Valide !",
            description: `Accès autorisé pour : ${event.title}`,
            className: "bg-green-600 text-white",
        });
    } else {
        setValidatedInfo(null);
        setScanResultStatus('error');
        toast({
            title: "Billet Invalide",
            description: "Aucun événement correspondant à ce billet n'a été trouvé.",
            variant: "destructive",
        });
    }
    
    setTimeout(() => resetScanner(), 4000);
  };

  const handleScan = (result: any) => {
    if (result && scanResultStatus !== 'success' && scanResultStatus !== 'error') {
        processValidation(result.getText());
    }
  };
  
  const handleManualValidation = (e: React.FormEvent) => {
      e.preventDefault();
      processValidation(manualTicketId);
  }

  const handleError = (error: any) => {
    console.error('QR Scan Error:', error);
    if (error && error.name === 'NotAllowedError') {
      setHasCameraPermission(false);
    }
  };

  const { ref } = useZxing({
    onDecodeResult: handleScan,
    onError: handleError,
    onDecode: () => {
      if (hasCameraPermission === null || hasCameraPermission === false) {
        setHasCameraPermission(true);
      }
      if (scanResultStatus === 'idle') {
        setScanResultStatus('scanning');
      }
    }
  });


  const renderResult = () => {
    switch (scanResultStatus) {
      case 'success':
        if (!validatedInfo) return null;
        return (
          <div className="flex flex-col items-center gap-2 text-green-500 w-full">
            <CheckCircle className="h-12 w-12" />
            <p className="font-bold text-lg">Billet Valide</p>
            <div className="text-left w-full bg-muted/50 text-foreground p-3 rounded-md text-sm">
                <p className="font-bold">{validatedInfo.event.title}</p>
                <p className="text-muted-foreground">{validatedInfo.event.category}</p>
                 {validatedInfo.ticket && (
                    <p className="text-primary font-semibold mt-1">
                        Billet: {validatedInfo.ticket.name} ({validatedInfo.ticket.price.toLocaleString('fr-FR')} XOF)
                    </p>
                )}
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-2 text-destructive">
            <XCircle className="h-12 w-12" />
            <p className="font-bold text-lg">Billet Invalide</p>
            <p className="text-sm">Ce billet n'est pas reconnu.</p>
          </div>
        );
      case 'scanning':
         return <p className="text-muted-foreground text-center">En attente d'un QR code...</p>;
      case 'idle':
      default:
        return <p className="text-muted-foreground text-center">Placez un QR code devant la caméra.</p>;
    }
  };
  
  return (
    <div className="space-y-8">
      <Button variant="outline" asChild>
        <Link href="/promoter/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Button>

      <Card className="max-w-xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Ticket className="h-6 w-6" /> Scanner de Billets
          </CardTitle>
          <CardDescription>Validez les billets en scannant les QR codes ou en entrant l'ID de l'événement (simulation).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {hasCameraPermission === false ? (
                <div className="flex flex-col items-center text-destructive p-4 text-center">
                    <CameraOff className="h-16 w-16 mb-4" />
                    <Alert variant="destructive">
                        <AlertTitle>Accès à la caméra refusé</AlertTitle>
                        <AlertDescription>
                            Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser le scanner.
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
              <video ref={ref} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4 rounded-md border border-dashed h-36 flex items-center justify-center">
            {renderResult()}
          </div>
          
          <Separator />

          <div>
             <p className="text-sm font-medium text-center text-muted-foreground mb-4">Ou validez manuellement (entrez l'ID de l'événement) :</p>
             <form onSubmit={handleManualValidation} className="flex items-center gap-2">
                <Input 
                    type="text"
                    placeholder="Entrer l'ID de l'événement"
                    value={manualTicketId}
                    onChange={(e) => setManualTicketId(e.target.value)}
                    className="flex-grow"
                    aria-label="Numéro du billet"
                />
                <Button type="submit">
                    <Search className="mr-2 h-4 w-4" />
                    Valider
                </Button>
             </form>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
