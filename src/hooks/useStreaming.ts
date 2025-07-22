// src/hooks/useStreaming.ts - Hook React pour la gestion du streaming
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import StreamingService from '@/services/streaming';

interface StreamingState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentQuality: string;
  availableQualities: Array<{label: string; resolution: string; bandwidth: number; src: string}>;
  metrics: {
    bandwidth: number;
    latency: number;
    bufferHealth: number;
    droppedFrames: number;
    rebufferCount: number;
  };
  streamType: 'hls' | 'dash' | 'webrtc' | 'mp4';
  isAdaptiveBitrateEnabled: boolean;
}

interface UseStreamingOptions {
  enableAdaptiveBitrate?: boolean;
  preferredQuality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  enableLowLatency?: boolean;
  enableP2P?: boolean;
  maxBufferLength?: number;
  enableMetrics?: boolean;
  autoPlay?: boolean;
}

interface UseStreamingReturn extends StreamingState {
  initializeStream: (videoElement: HTMLVideoElement, src: string) => Promise<boolean>;
  setQuality: (quality: string) => void;
  toggleAdaptiveBitrate: () => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
  refresh: () => void;
}

export function useStreaming(options: UseStreamingOptions = {}): UseStreamingReturn {
  const streamingServiceRef = useRef<StreamingService | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  const [state, setState] = useState<StreamingState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    currentQuality: 'auto',
    availableQualities: [],
    metrics: {
      bandwidth: 0,
      latency: 0,
      bufferHealth: 0,
      droppedFrames: 0,
      rebufferCount: 0
    },
    streamType: 'mp4',
    isAdaptiveBitrateEnabled: options.enableAdaptiveBitrate ?? true
  });

  // Initialiser le service de streaming
  const initializeService = useCallback(() => {
    if (streamingServiceRef.current) {
      streamingServiceRef.current.destroy();
    }

    streamingServiceRef.current = new StreamingService({
      enableAdaptiveBitrate: options.enableAdaptiveBitrate ?? true,
      preferredQuality: options.preferredQuality ?? 'auto',
      enableLowLatency: options.enableLowLatency ?? false,
      enableP2P: options.enableP2P ?? false,
      maxBufferLength: options.maxBufferLength ?? 30,
      enableMetrics: options.enableMetrics ?? true
    });

    // Configurer les événements
    streamingServiceRef.current.addEventListener('loaded', () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        availableQualities: streamingServiceRef.current?.getAvailableQualities() || [],
        error: null
      }));
    });

    streamingServiceRef.current.addEventListener('playing', () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    });

    streamingServiceRef.current.addEventListener('paused', () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    });

    streamingServiceRef.current.addEventListener('buffering', () => {
      setState(prev => ({ ...prev, isLoading: true }));
    });

    streamingServiceRef.current.addEventListener('error', (event) => {
      setState(prev => ({
        ...prev,
        error: event.data?.message || 'Erreur de streaming',
        isLoading: false
      }));
    });

    streamingServiceRef.current.addEventListener('qualityChange', (event) => {
      setState(prev => ({ ...prev, currentQuality: event.data?.quality || 'auto' }));
    });

  }, [options]);

  // Initialiser le streaming avec un élément vidéo et une source
  const initializeStream = useCallback(async (videoElement: HTMLVideoElement, src: string): Promise<boolean> => {
    if (!streamingServiceRef.current) {
      initializeService();
    }

    videoElementRef.current = videoElement;
    setCurrentSrc(src);

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      streamType: getStreamType(src)
    }));

    try {
      const success = await streamingServiceRef.current!.initializeStream(videoElement, src);
      
      if (success && options.autoPlay) {
        await videoElement.play();
      }

      return success;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Échec de l\'initialisation du stream',
        isLoading: false 
      }));
      return false;
    }
  }, [initializeService, options.autoPlay]);

  // Fonction utilitaire pour détecter le type de stream
  const getStreamType = (src: string): StreamingState['streamType'] => {
    if (src.includes('.m3u8')) return 'hls';
    if (src.includes('.mpd')) return 'dash';
    if (src.includes('webrtc://') || src.includes('rtmp://')) return 'webrtc';
    return 'mp4';
  };

  // Changer la qualité
  const setQuality = useCallback((quality: string) => {
    streamingServiceRef.current?.setQuality(quality);
  }, []);

  // Basculer le bitrate adaptatif
  const toggleAdaptiveBitrate = useCallback(() => {
    const newState = !state.isAdaptiveBitrateEnabled;
    streamingServiceRef.current?.setAdaptiveBitrate(newState);
    setState(prev => ({ ...prev, isAdaptiveBitrateEnabled: newState }));
  }, [state.isAdaptiveBitrateEnabled]);

  // Contrôles de lecture
  const play = useCallback(async () => {
    if (videoElementRef.current) {
      try {
        await videoElementRef.current.play();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Impossible de démarrer la lecture' 
        }));
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (videoElementRef.current) {
      videoElementRef.current.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoElementRef.current) {
      videoElementRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Rafraîchir le stream
  const refresh = useCallback(() => {
    if (videoElementRef.current && currentSrc) {
      initializeStream(videoElementRef.current, currentSrc);
    }
  }, [initializeStream, currentSrc]);

  // Nettoyer les ressources
  const destroy = useCallback(() => {
    streamingServiceRef.current?.destroy();
    streamingServiceRef.current = null;
    videoElementRef.current = null;
  }, []);

  // Mettre à jour les métriques périodiquement
  useEffect(() => {
    if (!options.enableMetrics) return;

    const interval = setInterval(() => {
      if (streamingServiceRef.current) {
        const metrics = streamingServiceRef.current.getMetrics();
        setState(prev => ({
          ...prev,
          metrics: {
            bandwidth: metrics.bandwidth,
            latency: metrics.latency,
            bufferHealth: metrics.bufferHealth,
            droppedFrames: metrics.droppedFrames,
            rebufferCount: metrics.rebufferCount
          }
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [options.enableMetrics]);

  // Initialiser le service au montage
  useEffect(() => {
    initializeService();
    return () => {
      destroy();
    };
  }, [initializeService, destroy]);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    ...state,
    initializeStream,
    setQuality,
    toggleAdaptiveBitrate,
    play,
    pause,
    seek,
    setVolume,
    destroy,
    refresh
  };
}

// Hook spécialisé pour le streaming en direct
export function useLiveStreaming(options: UseStreamingOptions = {}) {
  const streamingOptions = {
    ...options,
    enableLowLatency: true,
    enableAdaptiveBitrate: true,
    maxBufferLength: 10, // Buffer plus court pour le live
    autoPlay: true
  };

  const streaming = useStreaming(streamingOptions);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{id: string; user: string; message: string; timestamp: number}>>([]);

  // Simuler le statut live et le nombre de spectateurs
  useEffect(() => {
    if (streaming.isPlaying) {
      setIsLive(true);
      
      // Simuler les changements de spectateurs
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 10) - 5));
      }, 5000);

      // Simuler des messages de chat
      const chatInterval = setInterval(() => {
        const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eva'];
        const messages = ['Super stream!', 'Excellente qualité', 'Question intéressante', '👍', 'Merci pour le contenu'];
        
        setChatMessages(prev => [...prev.slice(-10), {
          id: Date.now().toString(),
          user: users[Math.floor(Math.random() * users.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: Date.now()
        }]);
      }, 8000);

      return () => {
        clearInterval(viewerInterval);
        clearInterval(chatInterval);
      };
    } else {
      setIsLive(false);
    }
  }, [streaming.isPlaying]);

  const sendChatMessage = useCallback((message: string, user: string = 'Vous') => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user,
      message,
      timestamp: Date.now()
    }]);
  }, []);

  return {
    ...streaming,
    isLive,
    viewerCount,
    chatMessages,
    sendChatMessage,
    goLive: streaming.play,
    stopLive: streaming.pause
  };
}

// Hook pour VOD avec fonctionnalités avancées
export function useVODStreaming(options: UseStreamingOptions = {}) {
  const streamingOptions = {
    ...options,
    enableLowLatency: false,
    enableAdaptiveBitrate: true,
    maxBufferLength: 30
  };

  const streaming = useStreaming(streamingOptions);
  const [chapters, setChapters] = useState<Array<{time: number; title: string}>>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);

  // Mettre à jour le temps de lecture
  useEffect(() => {
    if (!videoElementRef.current) return;

    const video = videoElementRef.current;
    
    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setWatchedPercentage(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateTime);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateTime);
    };
  }, [videoElementRef.current]);

  // Changer la vitesse de lecture
  const changePlaybackRate = useCallback((rate: number) => {
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  // Aller au chapitre suivant/précédent
  const goToChapter = useCallback((index: number) => {
    if (chapters[index]) {
      streaming.seek(chapters[index].time);
    }
  }, [chapters, streaming.seek]);

  // Avancer/reculer rapidement
  const skipForward = useCallback((seconds: number = 10) => {
    streaming.seek(Math.min(duration, currentTime + seconds));
  }, [streaming.seek, currentTime, duration]);

  const skipBackward = useCallback((seconds: number = 10) => {
    streaming.seek(Math.max(0, currentTime - seconds));
  }, [streaming.seek, currentTime]);

  // Marquer comme favori ou ajouter un signet
  const addBookmark = useCallback((time?: number, title?: string) => {
    const bookmarkTime = time ?? currentTime;
    const bookmarkTitle = title ?? `Signet à ${Math.floor(bookmarkTime / 60)}:${(Math.floor(bookmarkTime) % 60).toString().padStart(2, '0')}`;
    
    // Ici vous pourriez sauvegarder en base de données
    console.log('Signet ajouté:', { time: bookmarkTime, title: bookmarkTitle });
  }, [currentTime]);

  return {
    ...streaming,
    chapters,
    playbackRate,
    currentTime,
    duration,
    watchedPercentage,
    changePlaybackRate,
    goToChapter,
    skipForward,
    skipBackward,
    addBookmark,
    setChapters
  };
}

// Hook utilitaire pour la qualité adaptative personnalisée
export function useAdaptiveQuality(streaming: ReturnType<typeof useStreaming>) {
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>('desktop');

  useEffect(() => {
    // Détecter le type d'appareil
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) {
      setDeviceType('mobile');
    } else if (/Tablet|iPad/i.test(userAgent)) {
      setDeviceType('tablet');
    }

    // Estimer la vitesse de connexion si disponible
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.downlink) {
        setNetworkSpeed(connection.downlink);
      }
    }
  }, []);

  // Recommander une qualité basée sur l'appareil et la connexion
  const getRecommendedQuality = useCallback(() => {
    if (networkSpeed < 1) return '360p';
    if (networkSpeed < 2.5) return '480p';
    if (deviceType === 'mobile' && networkSpeed < 5) return '720p';
    if (networkSpeed < 5) return '720p';
    return '1080p';
  }, [networkSpeed, deviceType]);

  // Appliquer automatiquement la qualité recommandée
  useEffect(() => {
    if (streaming.availableQualities.length > 0 && networkSpeed > 0) {
      const recommended = getRecommendedQuality();
      const hasQuality = streaming.availableQualities.some(q => q.label === recommended);
      
      if (hasQuality && streaming.currentQuality === 'auto') {
        setTimeout(() => streaming.setQuality(recommended), 2000);
      }
    }
  }, [streaming.availableQualities, networkSpeed, getRecommendedQuality, streaming]);

  return {
    networkSpeed,
    deviceType,
    recommendedQuality: getRecommendedQuality(),
    autoOptimize: () => streaming.setQuality(getRecommendedQuality())
  };
}

export default useStreaming;