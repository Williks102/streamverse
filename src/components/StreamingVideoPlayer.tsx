// src/components/StreamingVideoPlayer.tsx - Intégration complète
"use client";

import React, { useRef, useEffect } from 'react';
import { useStreaming, useLiveStreaming } from '@/hooks/useStreaming';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Maximize, 
  Radio,
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingVideoPlayerProps {
  src?: string | null;
  thumbnailUrl: string;
  title: string;
  isLive?: boolean;
  autoPlay?: boolean;
  enableChat?: boolean;
  className?: string;
}

export default function StreamingVideoPlayer({
  src,
  thumbnailUrl,
  title,
  isLive = false,
  autoPlay = false,
  enableChat = true,
  className
}: StreamingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Utiliser le hook approprié selon le type
  const streaming = isLive 
    ? useLiveStreaming({ 
        autoPlay, 
        enableLowLatency: true,
        enableMetrics: true 
      })
    : useStreaming({ 
        autoPlay, 
        enableAdaptiveBitrate: true,
        enableMetrics: true 
      });

  // Initialiser le streaming quand on a une source
  useEffect(() => {
    if (src && videoRef.current) {
      streaming.initializeStream(videoRef.current, src);
    }
  }, [src, streaming.initializeStream]);

  // Affichage des erreurs
  if (streaming.error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold">Erreur de streaming</h3>
            <p className="text-muted-foreground">{streaming.error}</p>
            <Button onClick={streaming.refresh}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Player vidéo */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={thumbnailUrl}
          playsInline
          onPlay={() => {/* géré par le hook */}}
          onPause={() => {/* géré par le hook */}}
        />

        {/* Overlay de chargement */}
        {streaming.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Chargement du stream...</p>
            </div>
          </div>
        )}

        {/* Indicateurs live */}
        {isLive && (
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              EN DIRECT
            </Badge>
            {'viewerCount' in streaming && (
              <Badge variant="outline" className="text-white border-white/20 bg-black/40">
                {streaming.viewerCount} spectateurs
              </Badge>
            )}
          </div>
        )}

        {/* Indicateur de qualité */}
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="text-white border-white/20 bg-black/40">
            {streaming.currentQuality} • {streaming.streamType.toUpperCase()}
          </Badge>
        </div>

        {/* Contrôles simplifiés */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={streaming.isPlaying ? streaming.pause : streaming.play}
              className="text-white hover:bg-white/20"
            >
              {streaming.isPlaying ? <Pause /> : <Play />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Volume2 />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Settings />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Maximize />
            </Button>
          </div>
        </div>
      </div>

      {/* Informations de streaming */}
      {streaming.metrics && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{streaming.metrics.bandwidth.toFixed(1)} Mbps</div>
            <div className="text-muted-foreground">Bande passante</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">{Math.round(streaming.metrics.latency)}ms</div>
            <div className="text-muted-foreground">Latence</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">{streaming.metrics.bufferHealth.toFixed(1)}s</div>
            <div className="text-muted-foreground">Buffer</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">{streaming.metrics.droppedFrames}</div>
            <div className="text-muted-foreground">Images perdues</div>
          </div>
        </div>
      )}

      {/* Qualités disponibles */}
      {streaming.availableQualities.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Qualités disponibles:</h4>
          <div className="flex flex-wrap gap-2">
            {streaming.availableQualities.map((quality) => (
              <Button
                key={quality.label}
                variant={streaming.currentQuality === quality.label ? "default" : "outline"}
                size="sm"
                onClick={() => streaming.setQuality(quality.label)}
              >
                {quality.resolution}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}