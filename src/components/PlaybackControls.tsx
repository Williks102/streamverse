"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Radio, Zap, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
  isLive?: boolean;
  onRecord?: () => void; // Placeholder for record functionality
  isRecording?: boolean; // Placeholder
}

export default function PlaybackControls({
  isPlaying,
  onPlayPause,
  onVolumeChange,
  onSeek,
  currentTime,
  duration,
  volume,
  isLive = false,
  onRecord,
  isRecording,
}: PlaybackControlsProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Debounce seek to avoid too many updates
  const [seekValue, setSeekValue] = useState(currentTime);
  useEffect(() => setSeekValue(currentTime), [currentTime]);

  const handleSeekChange = (value: number[]) => {
    setSeekValue(value[0]);
  };

  const handleSeekCommit = (value: number[]) => {
    onSeek(value[0]);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullScreen(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
      isPlaying && "opacity-100" // Keep visible if playing and mouse is away (optional behavior)
    )}>
      {!isLive && (
        <div className="flex items-center gap-2 mb-2">
          <Slider
            value={[seekValue]}
            max={duration}
            step={1}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="w-full [&>span>span]:bg-primary"
            aria-label="Seek bar"
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onPlayPause} className="text-foreground hover:text-primary">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          <div className="relative flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setShowVolumeSlider(!showVolumeSlider)} className="text-foreground hover:text-primary">
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            {showVolumeSlider && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-card rounded-md shadow-lg w-28">
                 <Slider
                  defaultValue={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => onVolumeChange(value[0] / 100)}
                  className="[&>span>span]:bg-primary"
                  aria-label="Volume control"
                />
              </div>
            )}
          </div>
          {!isLive && (
            <span className="text-xs text-foreground ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-1 text-xs text-red-500 font-semibold ml-2">
              <Radio size={14} className="animate-ping"/> LIVE
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && onRecord && (
             <Button variant="ghost" size="icon" onClick={onRecord} className={cn("text-foreground hover:text-primary", isRecording && "text-red-500")}>
              <Mic2 size={20} /> {/* Placeholder for record icon */}
              <span className="sr-only">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-foreground hover:text-primary">
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
