// src/components/VideoPlayer.tsx - Corrections des types
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import PlaybackControls from './PlaybackControls';
import { Zap, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src?: string | null; // ✅ Accepter null
  thumbnailUrl: string;
  isLive?: boolean;
  title: string;
  'data-ai-hint'?: string | null; // ✅ Accepter null
}

export default function VideoPlayer({ 
  src, 
  thumbnailUrl, 
  isLive = false, 
  title, 
  "data-ai-hint": dataAiHint 
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(isLive ? Infinity : 300);
  const [volume, setVolume] = useState(0.75);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handlePlayPause = () => {
    if (src && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        toast({ title: `Playback started for "${title}"` });
      } else {
        toast({ title: `Playback paused for "${title}"` });
      }
    }
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (src && videoRef.current) videoRef.current.volume = newVolume;
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (src && videoRef.current) videoRef.current.currentTime = time;
  };

  const handleRecord = () => {
    setIsRecording(!isRecording);
    toast({ title: !isRecording ? "Recording started (mock)" : "Recording stopped (mock)" });
  };

  useEffect(() => {
    if (isPlaying && !isLive) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime < duration) return prevTime + 1;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          return duration;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration, isLive]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && src) { // ✅ Vérifier que src existe
      const updateProgress = () => setCurrentTime(video.currentTime);
      const updateDuration = () => setDuration(video.duration);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolume = () => setVolume(video.volume);

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('durationchange', updateDuration);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('volumechange', handleVolume);
      
      setDuration(video.duration || (isLive ? Infinity : 300));
      setVolume(video.volume);

      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('durationchange', updateDuration);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('volumechange', handleVolume);
      };
    }
  }, [src, isLive]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl group w-full">
      {/* ✅ Vérification stricte de src avant d'afficher la vidéo */}
      {src && typeof src === 'string' && src.trim() !== '' && !isLive ? (
        <video 
          ref={videoRef} 
          src={src} 
          className="w-full h-full object-contain" 
          poster={thumbnailUrl} 
        />
      ) : (
        <>
          <Image
            src={thumbnailUrl}
            alt={title || "Video placeholder"}
            fill
            style={{ objectFit: 'cover' }} // ✅ Utiliser style au lieu de objectFit prop
            priority
            data-ai-hint={dataAiHint || 'video content'} // ✅ Fallback pour null
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {!isPlaying && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePlayPause} 
                className="w-20 h-20 text-white hover:text-primary hover:bg-white/10 rounded-full"
              >
                <Play size={48} className="fill-current" />
              </Button>
            )}
            {isLive && !isPlaying && (
              <div className="absolute top-4 left-4 text-white p-2 bg-red-600/80 rounded text-sm font-semibold animate-pulse">
                STREAM OFFLINE (placeholder)
              </div>
            )}
            {isLive && isPlaying && (
              <div className="absolute top-4 left-4 text-white p-2 bg-green-600/80 rounded text-sm font-semibold">
                STREAMING LIVE (placeholder)
              </div>
            )}
          </div>
        </>
      )}
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isLive={isLive}
        onRecord={isLive ? handleRecord : undefined}
        isRecording={isLive ? isRecording : undefined}
      />
    </div>
  );
}