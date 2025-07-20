"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import PlaybackControls from './PlaybackControls';
import { Zap, Play } from 'lucide-react'; // Zap for placeholder, Play for play button
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button'; // Added import for Button

interface VideoPlayerProps {
  src?: string; // Actual video source
  thumbnailUrl: string;
  isLive?: boolean;
  title: string;
  'data-ai-hint'?: string;
}

export default function VideoPlayer({ src, thumbnailUrl, isLive = false, title, "data-ai-hint": dataAiHint }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(isLive ? Infinity : 300); // Mock duration 5 mins for VOD
  const [volume, setVolume] = useState(0.75);
  const [isRecording, setIsRecording] = useState(false); // Mock recording state
  const videoRef = useRef<HTMLVideoElement | null>(null); // If using actual video element
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handlePlayPause = () => {
    if (src && videoRef.current) { // For actual video element
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else { // Mock behavior
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
    // toast({ title: `Volume set to ${Math.round(newVolume * 100)}%`});
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (src && videoRef.current) videoRef.current.currentTime = time;
    // toast({ title: `Seeked to ${Math.round(time)}s`});
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
          clearInterval(intervalRef.current!);
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


  // Effect for actual video element updates (if used)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
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
      
      // Initial setup
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
      {/* Replace with actual <video> tag if src is available */}
      {src && !isLive ? (
        <video ref={videoRef} src={src} className="w-full h-full object-contain" poster={thumbnailUrl} />
      ) : (
        <>
          <Image
            src={thumbnailUrl}
            alt={title || "Video placeholder"}
            fill // Changed from layout="fill" to fill for Next 13+
            objectFit="cover"
            priority
            data-ai-hint={dataAiHint || 'video content'}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {!isPlaying && (
              <Button variant="ghost" size="icon" onClick={handlePlayPause} className="w-20 h-20 text-white hover:text-primary hover:bg-white/10 rounded-full">
                <Play size={48} className="fill-current" />
              </Button>
            )}
             {isLive && !isPlaying && (
              <div className="absolute top-4 left-4 text-white p-2 bg-red-600/80 rounded text-sm font-semibold animate-pulse">STREAM OFFLINE (placeholder)</div>
            )}
            {isLive && isPlaying && (
              <div className="absolute top-4 left-4 text-white p-2 bg-green-600/80 rounded text-sm font-semibold">STREAMING LIVE (placeholder)</div>
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
