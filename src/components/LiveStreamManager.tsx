// src/components/LiveStreamManager.tsx - Gestion avancée du live streaming
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Radio, 
  RadioIcon, 
  Users, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StreamConfig {
  resolution: '720p' | '1080p' | '480p';
  bitrate: number;
  fps: number;
  enableAudio: boolean;
  enableVideo: boolean;
  enableChat: boolean;
  isPrivate: boolean;
  maxViewers?: number;
}

interface ViewerStats {
  current: number;
  peak: number;
  total: number;
  countries: Record<string, number>;
  devices: Record<string, number>;
}

interface StreamStatus {
  isLive: boolean;
  isConnected: boolean;
  isRecording: boolean;
  startTime?: Date;
  duration: number;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
  latency: number; // en millisecondes
  bandwidth: number; // en Mbps
}

interface LiveStreamManagerProps {
  eventId: string;
  eventTitle: string;
  isPromoter?: boolean;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  className?: string;
}

export default function LiveStreamManager({
  eventId,
  eventTitle,
  isPromoter = false,
  onStreamStart,
  onStreamEnd,
  className
}: LiveStreamManagerProps) {
  // États principaux
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    isConnected: false,
    isRecording: false,
    duration: 0,
    quality: 'offline',
    latency: 0,
    bandwidth: 0
  });

  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    resolution: '720p',
    bitrate: 2500,
    fps: 30,
    enableAudio: true,
    enableVideo: true,
    enableChat: true,
    isPrivate: false,
    maxViewers: undefined
  });

  const [viewerStats, setViewerStats] = useState<ViewerStats>({
    current: 0,
    peak: 0,
    total: 0,
    countries: {},
    devices: {}
  });

  const [streamKey, setStreamKey] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(!streamStatus.isLive);
  const [error, setError] = useState<string | null>(null);

  // Refs pour WebRTC
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  // Générer une clé de stream unique
  const generateStreamKey = useCallback(() => {
    const key = `sk_live_${eventId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setStreamKey(key);
    setStreamUrl(`rtmp://live.streamverse.com/live/${key}`);
  }, [eventId]);

  // Initialiser WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Configuration STUN/TURN
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // En production, ajouter des serveurs TURN
          // {
          //   urls: 'turn:your-turn-server.com:3478',
          //   username: 'username',
          //   credential: 'password'
          // }
        ]
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Gestionnaires d'événements WebRTC
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        setStreamStatus(prev => ({
          ...prev,
          isConnected: state === 'connected' || state === 'completed',
          quality: state === 'connected' ? 'excellent' : 
                  state === 'checking' ? 'good' : 'poor'
        }));
      };

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      return true;
    } catch (error) {
      console.error('Erreur initialisation WebRTC:', error);
      setError('Erreur d\'initialisation de la connexion');
      return false;
    }
  }, []);

  // Démarrer le stream
  const startStream = useCallback(async () => {
    try {
      setError(null);
      
      // 1. Obtenir l'accès aux médias
      const constraints: MediaStreamConstraints = {
        video: streamConfig.enableVideo ? {
          width: { ideal: streamConfig.resolution === '1080p' ? 1920 : 
                          streamConfig.resolution === '720p' ? 1280 : 854 },
          height: { ideal: streamConfig.resolution === '1080p' ? 1080 : 
                           streamConfig.resolution === '720p' ? 720 : 480 },
          frameRate: { ideal: streamConfig.fps }
        } : false,
        audio: streamConfig.enableAudio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Initialiser WebRTC
      const webrtcInitialized = await initializeWebRTC();
      if (!webrtcInitialized) return;

      // 3. Ajouter les tracks au peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // 4. Mettre à jour le statut
      setStreamStatus(prev => ({
        ...prev,
        isLive: true,
        startTime: new Date(),
        quality: 'good'
      }));

      setIsSetupMode(false);
      
      toast({
        title: "Stream démarré",
        description: "Votre diffusion en direct a commencé avec succès"
      });

      onStreamStart?.();

      // 5. Simuler les statistiques (en production, recevoir via WebSocket)
      startStatsSimulation();

    } catch (error) {
      console.error('Erreur démarrage stream:', error);
      setError('Impossible d\'accéder à la caméra/microphone');
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le stream",
        variant: "destructive"
      });
    }
  }, [streamConfig, initializeWebRTC, onStreamStart, toast]);

  // Arrêter le stream
  const stopStream = useCallback(() => {
    try {
      // Arrêter tous les tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Fermer la connexion WebRTC
      peerConnectionRef.current?.close();
      
      // Nettoyer les références
      localStreamRef.current = null;
      peerConnectionRef.current = null;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setStreamStatus(prev => ({
        ...prev,
        isLive: false,
        isConnected: false,
        quality: 'offline'
      }));

      setIsSetupMode(true);

      toast({
        title: "Stream arrêté",
        description: "Votre diffusion en direct s'est terminée"
      });

      onStreamEnd?.();

    } catch (error) {
      console.error('Erreur arrêt stream:', error);
    }
  }, [onStreamEnd, toast]);

  // Simuler les statistiques en temps réel
  const startStatsSimulation = useCallback(() => {
    const interval = setInterval(() => {
      if (!streamStatus.isLive) {
        clearInterval(interval);
        return;
      }

      setViewerStats(prev => {
        const newCurrent = Math.max(0, prev.current + Math.floor(Math.random() * 10) - 5);
        return {
          ...prev,
          current: newCurrent,
          peak: Math.max(prev.peak, newCurrent),
          total: prev.total + Math.floor(Math.random() * 3)
        };
      });

      setStreamStatus(prev => ({
        ...prev,
        duration: prev.duration + 1,
        latency: 1500 + Math.random() * 1000,
        bandwidth: 2.5 + Math.random() * 1.5
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [streamStatus.isLive]);

  // Copier l'URL du stream
  const copyStreamUrl = useCallback(() => {
    navigator.clipboard.writeText(streamUrl);
    toast({ title: "URL copiée", description: "L'URL du stream a été copiée" });
  }, [streamUrl, toast]);

  // Générer la clé au premier chargement
  useEffect(() => {
    if (!streamKey) {
      generateStreamKey();
    }
  }, [streamKey, generateStreamKey]);

  // Interface promoteur
  if (isPromoter) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Gestion du Stream - {eventTitle}
          </CardTitle>
          <CardDescription>
            Contrôlez votre diffusion en direct
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isSetupMode ? "setup" : "live"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Configuration</TabsTrigger>
              <TabsTrigger value="live" disabled={!streamStatus.isLive}>En Direct</TabsTrigger>
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
            </TabsList>

            {/* Configuration */}
            <TabsContent value="setup" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prévisualisation vidéo */}
                <div className="space-y-4">
                  <Label>Prévisualisation</Label>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video bg-black rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStreamConfig(prev => ({ ...prev, enableVideo: !prev.enableVideo }))}
                    >
                      {streamConfig.enableVideo ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStreamConfig(prev => ({ ...prev, enableAudio: !prev.enableAudio }))}
                    >
                      {streamConfig.enableAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Paramètres */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution">Résolution</Label>
                    <select
                      id="resolution"
                      value={streamConfig.resolution}
                      onChange={(e) => setStreamConfig(prev => ({ 
                        ...prev, 
                        resolution: e.target.value as StreamConfig['resolution']
                      }))}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value="480p">480p (854x480)</option>
                      <option value="720p">720p (1280x720)</option>
                      <option value="1080p">1080p (1920x1080)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="fps">Images par seconde: {streamConfig.fps}</Label>
                    <Slider
                      value={[streamConfig.fps]}
                      onValueChange={([value]) => setStreamConfig(prev => ({ ...prev, fps: value }))}
                      min={15}
                      max={60}
                      step={15}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bitrate">Bitrate: {streamConfig.bitrate} kbps</Label>
                    <Slider
                      value={[streamConfig.bitrate]}
                      onValueChange={([value]) => setStreamConfig(prev => ({ ...prev, bitrate: value }))}
                      min={500}
                      max={8000}
                      step={250}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="chat">Activer le chat</Label>
                      <Switch
                        id="chat"
                        checked={streamConfig.enableChat}
                        onCheckedChange={(checked) => setStreamConfig(prev => ({ ...prev, enableChat: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="private">Stream privé</Label>
                      <Switch
                        id="private"
                        checked={streamConfig.isPrivate}
                        onCheckedChange={(checked) => setStreamConfig(prev => ({ ...prev, isPrivate: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* URL de stream */}
              <div className="space-y-2">
                <Label>URL du Stream</Label>
                <div className="flex gap-2">
                  <Input value={streamUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={copyStreamUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Utilisez cette URL dans votre logiciel de streaming (OBS, XSplit, etc.)
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <Button
                onClick={startStream}
                disabled={streamStatus.isLive}
                className="w-full"
                size="lg"
              >
                {streamStatus.isLive ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Stream en cours
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 mr-2" />
                    Démarrer le Stream
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Contrôle en direct */}
            <TabsContent value="live" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Statut du Stream</h3>
                    <Badge variant={streamStatus.isLive ? "destructive" : "secondary"}>
                      {streamStatus.isLive ? "EN DIRECT" : "HORS LIGNE"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Spectateurs</div>
                      <div className="text-2xl font-bold">{viewerStats.current}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Durée</div>
                      <div className="text-2xl font-bold">
                        {Math.floor(streamStatus.duration / 60)}:{(streamStatus.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Latence</div>
                      <div className="text-2xl font-bold">{Math.round(streamStatus.latency)}ms</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Bande passante</div>
                      <div className="text-2xl font-bold">{streamStatus.bandwidth.toFixed(1)} Mbps</div>
                    </div>
                  </div>

                  <Button
                    onClick={stopStream}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    Arrêter le Stream
                  </Button>
                </div>

                <div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video bg-black rounded-lg"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Statistiques */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Spectateurs actuels</span>
                  </div>
                  <div className="text-3xl font-bold">{viewerStats.current}</div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5" />
                    <span className="font-semibold">Pic de spectateurs</span>
                  </div>
                  <div className="text-3xl font-bold">{viewerStats.peak}</div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-5 h-5" />
                    <span className="font-semibold">Vues totales</span>
                  </div>
                  <div className="text-3xl font-bold">{viewerStats.total}</div>
                </div>
              </div>

              <div className="text-center text-muted-foreground">
                <p>Statistiques détaillées disponibles après le stream</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Interface spectateur
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={streamStatus.isLive ? "destructive" : "secondary"}>
            <Radio className="w-3 h-3 mr-1" />
            {streamStatus.isLive ? "EN DIRECT" : "HORS LIGNE"}
          </Badge>
          {streamStatus.isLive && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {viewerStats.current} spectateurs
              </span>
              <span>Démarré il y a {Math.floor(streamStatus.duration / 60)} min</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2" />
            J'aime
          </Button>
        </div>
      </div>

      {/* Chat en direct pour les spectateurs */}
      {streamStatus.isLive && streamConfig.enableChat && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat en direct
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 h-64 overflow-y-auto">
              {/* Messages simulés */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  U1
                </div>
                <div>
                  <div className="font-semibold text-sm">Utilisateur123</div>
                  <div className="text-sm">Super stream ! 🔥</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  M2
                </div>
                <div>
                  <div className="font-semibold text-sm">Marie_P</div>
                  <div className="text-sm">Excellente qualité vidéo !</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                  A3
                </div>
                <div>
                  <div className="font-semibold text-sm">Alex_Dev</div>
                  <div className="text-sm">Question très intéressante à 15:30</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Input placeholder="Tapez votre message..." className="flex-1" />
              <Button>Envoyer</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}