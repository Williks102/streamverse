// src/components/PlaybackControls.tsx - Contrôles avancés
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings,
  Download,
  Share2,
  MoreHorizontal,
  Radio,
  RotateCcw,
  SkipBack,
  SkipForward,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLive?: boolean;
  bufferedRanges?: TimeRanges | null;
  onRecord?: () => void;
  isRecording?: boolean;
  currentQuality?: string;
  availableQualities?: Array<{label: string; resolution: string; bandwidth: number; src: string}>;
  onQualityChange?: (quality: string) => void;
  streamType?: 'mp4' | 'hls' | 'dash' | 'webrtc';
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  playbackState?: 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'ended';
  onShare?: () => void;
  onDownload?: () => void;
}

export default function PlaybackControls({
  isPlaying,
  onPlayPause,
  onVolumeChange,
  onSeek,
  onMute,
  onFullscreen,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  isLive = false,
  bufferedRanges,
  onRecord,
  isRecording = false,
  currentQuality = 'auto',
  availableQualities = [],
  onQualityChange,
  streamType = 'mp4',
  connectionStatus = 'connected',
  playbackState = 'idle',
  onShare,
  onDownload
}: PlaybackControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Formater le temps en MM:SS ou HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return isLive ? 'EN DIRECT' : '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculer le pourcentage de progression
  const progressPercentage = isLive 
    ? 100 
    : duration > 0 
      ? ((isDragging ? dragTime : currentTime) / duration) * 100 
      : 0;

  // Calculer les segments buffered
  const getBufferedSegments = (): Array<{start: number; end: number}> => {
    if (!bufferedRanges || duration <= 0) return [];
    
    const segments = [];
    for (let i = 0; i < bufferedRanges.length; i++) {
      segments.push({
        start: (bufferedRanges.start(i) / duration) * 100,
        end: (bufferedRanges.end(i) / duration) * 100
      });
    }
    return segments;
  };

  // Gérer le clic sur la barre de progression
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    onSeek(newTime);
  };

  // Gérer le drag de la barre de progression
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive) return;
    
    setIsDragging(true);
    handleProgressMouseMove(e);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newTime = (percentage / 100) * duration;
    
    setDragTime(newTime);
  };

  const handleProgressMouseUp = () => {
    if (isDragging) {
      onSeek(dragTime);
      setIsDragging(false);
    }
  };

  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onPlayPause();
          break;
        case 'KeyM':
          onMute();
          break;
        case 'KeyF':
          onFullscreen();
          break;
        case 'ArrowLeft':
          if (!isLive) onSeek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          if (!isLive) onSeek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeChange(Math.max(0, volume - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, volume, isLive, onPlayPause, onMute, onFullscreen, onSeek, onVolumeChange]);

  // Icône de statut de connexion
  const ConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
        {/* Barre de progression */}
        <div className="px-4 pb-2">
          <div
            ref={progressRef}
            className={cn(
              "relative h-1 bg-white/20 rounded-full cursor-pointer group",
              isLive && "cursor-not-allowed opacity-50"
            )}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseUp={handleProgressMouseUp}
            onMouseLeave={handleProgressMouseUp}
          >
            {/* Segments buffered */}
            {getBufferedSegments().map((segment, index) => (
              <div
                key={index}
                className="absolute top-0 h-full bg-white/40 rounded-full"
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.end - segment.start}%`
                }}
              />
            ))}
            
            {/* Barre de progression */}
            <div
              className="absolute top-0 h-full bg-red-500 rounded-full group-hover:bg-red-400"
              style={{ width: `${progressPercentage}%` }}
            />
            
            {/* Curseur de progression */}
            {!isLive && (
              <div
                className="absolute top-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercentage}%` }}
              />
            )}
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="flex items-center justify-between px-4 pb-4">
          {/* Contrôles de lecture */}
          <div className="flex items-center gap-2">
            {/* Bouton reculer (non-live) */}
            {!isLive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSeek(Math.max(0, currentTime - 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reculer 10s</TooltipContent>
              </Tooltip>
            )}

            {/* Bouton play/pause */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPlayPause}
                  disabled={playbackState === 'loading' || playbackState === 'buffering'}
                  className="text-white hover:bg-white/20 w-12 h-12"
                >
                  {playbackState === 'loading' || playbackState === 'buffering' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {playbackState === 'loading' ? 'Chargement...' : 
                 playbackState === 'buffering' ? 'Mise en mémoire tampon...' :
                 isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
              </TooltipContent>
            </Tooltip>

            {/* Bouton avancer (non-live) */}
            {!isLive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Avancer 10s</TooltipContent>
              </Tooltip>
            )}

            {/* Contrôle du volume */}
            <div 
              className="flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Muet (M)</TooltipContent>
              </Tooltip>

              {/* Slider de volume */}
              {showVolumeSlider && (
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={([value]) => onVolumeChange(value)}
                    max={1}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Bouton d'enregistrement (live seulement) */}
            {isLive && onRecord && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRecord}
                    className={cn(
                      "text-white hover:bg-white/20",
                      isRecording && "bg-red-600/20 text-red-400"
                    )}
                  >
                    <Radio className={cn("w-5 h-5", isRecording && "animate-pulse")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Temps */}
            <div className="text-white text-sm font-mono min-w-[80px]">
              {formatTime(currentTime)}
              {!isLive && duration > 0 && (
                <span className="text-white/60"> / {formatTime(duration)}</span>
              )}
            </div>
          </div>

          {/* Contrôles droite */}
          <div className="flex items-center gap-2">
            {/* Indicateur de statut de connexion */}
            <div className="flex items-center gap-1">
              <ConnectionIcon />
              {streamType && streamType !== 'mp4' && (
                <Badge variant="outline" className="text-xs text-white border-white/20 bg-black/20">
                  {streamType.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Menu qualité */}
            {availableQualities.length > 0 && onQualityChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/20">
                  <DropdownMenuLabel className="text-white">Qualité vidéo</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  {availableQualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality.label}
                      onClick={() => onQualityChange(quality.label)}
                      className={cn(
                        "text-white hover:bg-white/20 cursor-pointer",
                        currentQuality === quality.label && "bg-white/10"
                      )}
                    >
                      {quality.resolution} 
                      {quality.label === currentQuality && " ✓"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Menu actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/90 border-white/20">
                {onShare && (
                  <DropdownMenuItem
                    onClick={onShare}
                    className="text-white hover:bg-white/20 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </DropdownMenuItem>
                )}
                {onDownload && !isLive && (
                  <DropdownMenuItem
                    onClick={onDownload}
                    className="text-white hover:bg-white/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem className="text-white/60 cursor-default">
                  Raccourcis: Espace, M, F, ←→, ↑↓
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bouton plein écran */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Plein écran (F)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}