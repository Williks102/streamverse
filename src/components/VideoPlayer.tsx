// src/components/VideoPlayer.tsx - Version streaming avancée
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import PlaybackControls from './PlaybackControls';
import { Play, Loader2, AlertCircle, Radio, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

// Types pour les différents formats de streaming
type StreamType = 'mp4' | 'hls' | 'dash' | 'webrtc';
type VideoQuality = '240p' | '360p' | '480p' | '720p' | '1080p' | 'auto';
type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'ended';

interface StreamQuality {
  label: string;
  resolution: string;
  bandwidth: number;
  src: string;
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
  const [viewerCount, setViewerCount] = useState(isLive ? Math.floor(Math.random() * 1000) + 100 : 0);
  
  // États du live
  const [isRecording, setIsRecording] = useState(false);
  const [liveLatency, setLiveLatency] = useState(2.5); // secondes
  const [isLiveCatchingUp, setIsLiveCatchingUp] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Détecter le type de stream basé sur l'URL
  const detectStreamType = useCallback((url: string): StreamType => {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mpd')) return 'dash';
    if (url.includes('webrtc://') || url.includes('rtmp://')) return 'webrtc';
    return 'mp4';
  }, []);

  // Gérer la visibilité des contrôles
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playbackState === 'playing') {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [playbackState]);

  // Actions du player
  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (playbackState === 'playing') {
        video.pause();
        setPlaybackState('paused');
      } else {
        setPlaybackState('loading');
        await video.play();
        setPlaybackState('playing');
        
        if (!src) {
          // Mode simulation pour les événements sans source
          toast({ title: `Lecture démarrée pour "${title}"` });
        }
      }
    } catch (error) {
      console.error('Erreur de lecture:', error);
      setPlaybackState('error');
      toast({ 
        title: "Erreur de lecture", 
        description: "Impossible de lire la vidéo", 
        variant: "destructive" 
      });
    }
  }, [playbackState, src, title, toast]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (isLive && time > currentTime) {
      // Pour le live, empêcher de "seek" dans le futur
      return;
    }
    
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, [currentTime, isLive]);

  const handleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Erreur fullscreen:', error);
    }
  }, [isFullscreen]);

  const handleQualityChange = useCallback((quality: VideoQuality) => {
    setCurrentQuality(quality);
    // Ici, on implémenterait le changement de qualité selon le type de stream
    toast({ title: `Qualité changée : ${quality}` });
  }, [toast]);

  const goLive = useCallback(() => {
    if (isLive && videoRef.current) {
      const video = videoRef.current;
      // Aller au live (position la plus récente)
      video.currentTime = video.duration || currentTime + liveLatency;
      setIsLiveCatchingUp(false);
      toast({ title: "Retour au direct" });
    }
  }, [isLive, currentTime, liveLatency, toast]);

  // Événements vidéo natifs
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const handleLoadStart = () => setPlaybackState('loading');
    const handleCanPlay = () => {
      if (playbackState === 'loading') {
        setPlaybackState('paused');
      }
      setConnectionStatus('connected');
    };
    const handlePlay = () => setPlaybackState('playing');
    const handlePause = () => setPlaybackState('paused');
    const handleEnded = () => setPlaybackState('ended');
    const handleWaiting = () => setPlaybackState('buffering');
    const handleError = () => {
      setPlaybackState('error');
      setConnectionStatus('disconnected');
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isLive) {
        // Vérifier si on est en retard par rapport au live
        const delay = (video.duration || 0) - video.currentTime;
        setIsLiveCatchingUp(delay > 10); // Plus de 10 secondes de retard
      }
    };
    
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleProgress = () => setBufferedRanges(video.buffered);

    // Ajouter les événements
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('progress', handleProgress);

    // Configurer le type de stream
    const type = detectStreamType(src);
    setStreamType(type);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('progress', handleProgress);
    };
  }, [src, detectStreamType, isLive, playbackState]);

  // Gestion du fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Simulation du live pour les événements sans source réelle
  useEffect(() => {
    if (isLive && !src && playbackState === 'playing') {
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
        // Simuler des changements de nombre de viewers
        if (Math.random() < 0.1) {
          setViewerCount(prev => Math.max(50, prev + Math.floor(Math.random() * 20) - 10));
        }
      }, 1000);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLive, src, playbackState]);

  // Rendu du contenu vidéo
  const renderVideoContent = () => {
    if (src && (streamType === 'mp4' || streamType === 'hls' || streamType === 'dash')) {
      return (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          poster={thumbnailUrl}
          preload="metadata"
          autoPlay={autoplay}
          muted={muted}
          playsInline
        >
          <source src={src} type={streamType === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} />
          <track kind="captions" />
        </video>
      );
    }

    // Fallback avec thumbnail et overlay
    return (
      <>
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
          priority
          className="bg-black"
          data-ai-hint={dataAiHint || 'video content'}
        />
        
        {/* Overlay de statut */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          {playbackState === 'loading' && (
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p>Chargement...</p>
            </div>
          )}
          
          {playbackState === 'error' && (
            <div className="flex flex-col items-center gap-4 text-white">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p>Erreur de lecture</p>
            </div>
          )}
          
          {(playbackState === 'idle' || playbackState === 'paused') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="w-20 h-20 text-white hover:text-primary hover:bg-white/10 rounded-full"
            >
              <Play size={48} className="fill-current" />
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden shadow-2xl group w-full",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isFullscreen && setShowControls(true)}
    >
      {/* Contenu vidéo */}
      {renderVideoContent()}
      
      {/* Indicateurs de statut live */}
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Badge 
            variant={playbackState === 'playing' ? 'destructive' : 'secondary'}
            className={cn(
              "text-sm font-semibold",
              playbackState === 'playing' && "animate-pulse"
            )}
          >
            <Radio className="w-3 h-3 mr-1" />
            {playbackState === 'playing' ? 'EN DIRECT' : 'HORS LIGNE'}
          </Badge>
          
          {playbackState === 'playing' && viewerCount > 0 && (
            <Badge variant="outline" className="text-white border-white/20 bg-black/20">
              {viewerCount.toLocaleString()} spectateurs
            </Badge>
          )}
        </div>
      )}
      
      {/* Indicateur de connexion */}
      {connectionStatus === 'connecting' && (
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="text-white border-white/20 bg-black/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connexion...
          </Badge>
        </div>
      )}
      
      {connectionStatus === 'disconnected' && src && (
        <div className="absolute top-4 right-4">
          <Badge variant="destructive">
            <WifiOff className="w-3 h-3 mr-1" />
            Déconnecté
          </Badge>
        </div>
      )}
      
      {/* Bouton retour au live */}
      {isLive && isLiveCatchingUp && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Button onClick={goLive} className="bg-red-600 hover:bg-red-700">
            <Radio className="w-4 h-4 mr-2" />
            Retour au direct
          </Button>
        </div>
      )}
      
      {/* Contrôles de lecture */}
      {showControls && (
        <PlaybackControls
          isPlaying={playbackState === 'playing'}
          onPlayPause={handlePlayPause}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
          onMute={handleMute}
          onFullscreen={handleFullscreen}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          isLive={isLive}
          bufferedRanges={bufferedRanges}
          onRecord={isLive ? () => setIsRecording(!isRecording) : undefined}
          isRecording={isRecording}
          currentQuality={currentQuality}
          availableQualities={availableQualities}
          onQualityChange={handleQualityChange}
          streamType={streamType}
          connectionStatus={connectionStatus}
          playbackState={playbackState}
        />
      )}
    </div>
  );
}