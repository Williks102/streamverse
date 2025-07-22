// src/components/VideoPlayer.tsx - Version avec types corrigés
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, Loader2, AlertCircle, Radio, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VideoQuality, StreamType, PlaybackState } from '@/types';

interface VideoPlayerProps {
  src?: string | null;
  thumbnailUrl: string;
  isLive?: boolean;
  title: string;
  'data-ai-hint'?: string | null;
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
}

// ✅ Interface corrigée pour StreamQuality
interface StreamQuality {
  label: string;
  resolution: string;
  bandwidth: number;
  src: string;
  quality: VideoQuality; // ✅ Ajouté pour éviter les conflits de types
}

export default function VideoPlayer({ 
  src, 
  thumbnailUrl, 
  isLive = false, 
  title, 
  "data-ai-hint": dataAiHint,
  autoplay = false,
  muted = false,
  className
}: VideoPlayerProps) {
  // États du player
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(isLive ? Infinity : 0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bufferedRanges, setBufferedRanges] = useState<TimeRanges | null>(null);
  
  // États du streaming
  const [streamType, setStreamType] = useState<StreamType>('mp4');
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('auto');
  const [availableQualities, setAvailableQualities] = useState<StreamQuality[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [viewerCount, setViewerCount] = useState(isLive ? Math.floor(Math.random() * 500) + 10 : 0);
  const [retryCount, setRetryCount] = useState(0);
  const [streamMetrics, setStreamMetrics] = useState({
    bandwidth: 0,
    latency: 0,
    bufferHealth: 0,
    droppedFrames: 0
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // ✅ Fonction pour déterminer le type de stream depuis l'URL
  const detectStreamType = useCallback((url: string): StreamType => {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mpd')) return 'dash';
    if (url.includes('webrtc') || url.includes('ws://') || url.includes('wss://')) return 'webrtc';
    return 'mp4';
  }, []);

  // ✅ Génération des qualités disponibles avec types corrects
  const generateQualitiesFromSource = useCallback((sourceSrc: string): StreamQuality[] => {
    const baseQualities: Array<{resolution: string; label: string; quality: VideoQuality}> = [
      { resolution: '240p', label: '240p', quality: '240p' },
      { resolution: '360p', label: '360p', quality: '360p' },
      { resolution: '480p', label: '480p (SD)', quality: '480p' },
      { resolution: '720p', label: '720p (HD)', quality: '720p' },
      { resolution: '1080p', label: '1080p (Full HD)', quality: '1080p' }
    ];

    // ✅ Mapping correct avec tous les types requis
    return baseQualities.map((q, index) => ({
      label: q.label,
      resolution: q.resolution,
      bandwidth: (index + 1) * 1000000, // 1Mbps, 2Mbps, etc.
      src: sourceSrc.replace(/\.(mp4|m3u8|mpd)$/, `_${q.resolution}.$1`),
      quality: q.quality // ✅ Type VideoQuality correct
    }));
  }, []);

  // Initialisation du lecteur vidéo
  const initializePlayer = useCallback(async () => {
    if (!src || !videoRef.current) return;

    setPlaybackState('loading');
    setConnectionStatus('connecting');
    
    try {
      const video = videoRef.current;
      const detectedType = detectStreamType(src);
      setStreamType(detectedType);
      
      // Générer les qualités disponibles
      const qualities = generateQualitiesFromSource(src);
      setAvailableQualities(qualities);
      
      // Configuration de base
      video.src = src;
      video.muted = isMuted;
      video.volume = volume;
      
      // Event listeners
      const handleLoadedMetadata = () => {
        setDuration(isLive ? Infinity : video.duration);
        setPlaybackState('idle');
        setConnectionStatus('connected');
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (video.buffered.length > 0) {
          setBufferedRanges(video.buffered);
        }
      };

      const handlePlay = () => setPlaybackState('playing');
      const handlePause = () => setPlaybackState('paused');
      const handleWaiting = () => setPlaybackState('buffering');
      const handleCanPlay = () => {
        if (playbackState === 'buffering') {
          setPlaybackState('playing');
        }
      };

      const handleError = () => {
        setPlaybackState('error');
        setConnectionStatus('disconnected');
        console.error('Erreur de lecture vidéo');
      };

      // Ajouter les listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      // Autoplay si demandé
      if (autoplay) {
        try {
          await video.play();
        } catch (error) {
          console.warn('Autoplay bloqué par le navigateur');
        }
      }

      // Cleanup function
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };

    } catch (error) {
      console.error('Erreur initialisation player:', error);
      setPlaybackState('error');
      setConnectionStatus('disconnected');
    }
  }, [src, isMuted, volume, autoplay, isLive, detectStreamType, generateQualitiesFromSource, playbackState]);

  // ✅ Fonction pour changer la qualité - types compatibles
  const changeQuality = useCallback((quality: VideoQuality) => {
    const targetQuality = availableQualities.find(q => q.quality === quality);
    if (targetQuality && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = playbackState === 'playing';
      
      videoRef.current.src = targetQuality.src;
      setCurrentQuality(quality);
      
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (wasPlaying) {
            videoRef.current.play();
          }
        }
      }, { once: true });
    }
  }, [availableQualities, playbackState]);

  // Contrôles du lecteur
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (playbackState === 'playing') {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Erreur contrôle lecture:', error);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de contrôler la lecture vidéo",
        variant: "destructive"
      });
    }
  }, [playbackState, toast]);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    initializePlayer();
  }, [initializePlayer]);

  // Effets
  useEffect(() => {
    initializePlayer();
  }, [initializePlayer]);

  // Simuler mise à jour métriques pour live
  useEffect(() => {
    if (isLive && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        setStreamMetrics(prev => ({
          ...prev,
          bandwidth: Math.random() * 5000 + 1000,
          latency: Math.random() * 100 + 50,
          bufferHealth: Math.random() * 100,
        }));
        setViewerCount(Math.floor(Math.random() * 500) + 10);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isLive, connectionStatus]);

  // Interface d'erreur
  if (playbackState === 'error') {
    return (
      <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
        <div className="text-center text-white space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h3 className="text-lg font-semibold">Erreur de lecture</h3>
          <p className="text-sm text-gray-300">
            {connectionStatus === 'disconnected' ? 'Impossible de se connecter au stream' : 'Erreur de lecture vidéo'}
          </p>
          <Button onClick={retry} variant="outline">
            Réessayer {retryCount > 0 && `(${retryCount})`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-video bg-black rounded-lg overflow-hidden group", className)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnailUrl}
        playsInline
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Overlay de chargement */}
      {playbackState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Chargement...</p>
          </div>
        </div>
      )}

      {/* Indicateur de buffering */}
      {playbackState === 'buffering' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Play button overlay pour idle */}
      {playbackState === 'idle' && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/50 transition-colors"
        >
          <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
            <Play className="w-8 h-8 text-black ml-1" />
          </div>
        </button>
      )}

      {/* Indicateurs live */}
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Badge variant="destructive" className="animate-pulse">
            <Radio className="w-3 h-3 mr-1" />
            EN DIRECT
          </Badge>
          {connectionStatus === 'connected' && (
            <Badge variant="outline" className="text-white border-white/20 bg-black/60">
              {viewerCount} spectateurs
            </Badge>
          )}
        </div>
      )}

      {/* Indicateur qualité et type */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Badge variant="outline" className="text-white border-white/20 bg-black/60 text-xs">
          {currentQuality.toUpperCase()}
        </Badge>
        <Badge variant="outline" className="text-white border-white/20 bg-black/60 text-xs">
          {streamType.toUpperCase()}
        </Badge>
      </div>

      {/* Indicateur de connexion */}
      {connectionStatus !== 'connected' && (
        <div className="absolute bottom-4 right-4">
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 bg-black/60">
            <WifiOff className="w-3 h-3 mr-1" />
            {connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}
          </Badge>
        </div>
      )}
    </div>
  );
}