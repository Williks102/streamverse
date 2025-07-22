// src/services/streaming.ts - Service de gestion des différents types de streaming
"use client";

interface StreamQuality {
  label: string;
  resolution: string;
  bandwidth: number;
  src: string;
}

interface StreamingConfig {
  enableAdaptiveBitrate: boolean;
  preferredQuality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  enableLowLatency: boolean;
  enableP2P: boolean;
  maxBufferLength: number; // secondes
  enableMetrics: boolean;
}

interface StreamMetrics {
  currentQuality: string;
  bandwidth: number; // Mbps
  latency: number; // ms
  bufferHealth: number; // secondes
  droppedFrames: number;
  playbackStartTime: number;
  rebufferCount: number;
  totalRebufferTime: number;
}

type StreamType = 'hls' | 'dash' | 'webrtc' | 'mp4';
type StreamEvent = 'loaded' | 'playing' | 'paused' | 'buffering' | 'error' | 'qualityChange' | 'bitrateChange';

interface StreamEventData {
  type: StreamEvent;
  data?: any;
  timestamp: number;
}

class StreamingService {
  private videoElement: HTMLVideoElement | null = null;
  private hlsInstance: any = null; // Hls.js instance
  private dashInstance: any = null; // Dash.js instance
  private webrtcConnection: RTCPeerConnection | null = null;
  private currentStreamType: StreamType = 'mp4';
  private config: StreamingConfig;
  private metrics: StreamMetrics;
  private eventListeners: Map<StreamEvent, Function[]> = new Map();
  private qualityLevels: StreamQuality[] = [];
  private isAdaptiveBitrateEnabled = true;

  constructor(config: Partial<StreamingConfig> = {}) {
    this.config = {
      enableAdaptiveBitrate: true,
      preferredQuality: 'auto',
      enableLowLatency: false,
      enableP2P: false,
      maxBufferLength: 30,
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      currentQuality: 'auto',
      bandwidth: 0,
      latency: 0,
      bufferHealth: 0,
      droppedFrames: 0,
      playbackStartTime: 0,
      rebufferCount: 0,
      totalRebufferTime: 0
    };

    this.initializeEventListeners();
  }

  // Initialiser les écouteurs d'événements
  private initializeEventListeners() {
    ['loaded', 'playing', 'paused', 'buffering', 'error', 'qualityChange', 'bitrateChange'].forEach(event => {
      this.eventListeners.set(event as StreamEvent, []);
    });
  }

  // Ajouter un écouteur d'événement
  public addEventListener(event: StreamEvent, callback: Function) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  // Supprimer un écouteur d'événement
  public removeEventListener(event: StreamEvent, callback: Function) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Émettre un événement
  private emitEvent(event: StreamEvent, data?: any) {
    const listeners = this.eventListeners.get(event) || [];
    const eventData: StreamEventData = {
      type: event,
      data,
      timestamp: Date.now()
    };
    
    listeners.forEach(callback => callback(eventData));
  }

  // Détecter le type de stream
  private detectStreamType(src: string): StreamType {
    if (src.includes('.m3u8')) return 'hls';
    if (src.includes('.mpd')) return 'dash';
    if (src.includes('webrtc://') || src.includes('rtmp://')) return 'webrtc';
    return 'mp4';
  }

  // Initialiser le lecteur selon le type de stream
  public async initializePlayer(videoElement: HTMLVideoElement, src: string): Promise<boolean> {
    this.videoElement = videoElement;
    this.currentStreamType = this.detectStreamType(src);

    try {
      switch (this.currentStreamType) {
        case 'hls':
          return await this.initializeHLS(src);
        case 'dash':
          return await this.initializeDASH(src);
        case 'webrtc':
          return await this.initializeWebRTC(src);
        case 'mp4':
        default:
          return await this.initializeMP4(src);
      }
    } catch (error) {
      console.error('Erreur initialisation player:', error);
      this.emitEvent('error', { message: 'Erreur d\'initialisation du lecteur', error });
      return false;
    }
  }

  // Initialiser HLS (HTTP Live Streaming)
  private async initializeHLS(src: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Vérifier si HLS est supporté nativement
      if (this.videoElement?.canPlayType('application/vnd.apple.mpegurl')) {
        this.videoElement.src = src;
        this.setupNativeEventListeners();
        return true;
      }

      // Utiliser Hls.js
      const Hls = (await import('hls.js')).default;
      
      if (!Hls.isSupported()) {
        throw new Error('HLS non supporté par ce navigateur');
      }

      this.hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: this.config.enableLowLatency,
        backBufferLength: 90,
        maxBufferLength: this.config.maxBufferLength,
        maxMaxBufferLength: 120,
        enableSoftwareAES: true,
        p2pConfig: this.config.enableP2P ? {
          logLevel: 'warn',
          live: true
        } : false
      });

      this.hlsInstance.loadSource(src);
      this.hlsInstance.attachMedia(this.videoElement!);

      // Événements HLS
      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        this.extractQualityLevels();
        this.emitEvent('loaded');
      });

      this.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event: any, data: any) => {
        const level = this.hlsInstance.levels[data.level];
        this.metrics.currentQuality = `${level.height}p`;
        this.emitEvent('qualityChange', { quality: this.metrics.currentQuality });
      });

      this.hlsInstance.on(Hls.Events.ERROR, (event: any, data: any) => {
        if (data.fatal) {
          this.emitEvent('error', { message: 'Erreur HLS fatale', data });
        }
      });

      this.setupHLSMetrics();
      return true;

    } catch (error) {
      console.error('Erreur initialisation HLS:', error);
      return false;
    }
  }

  // Initialiser DASH (Dynamic Adaptive Streaming)
  private async initializeDASH(src: string): Promise<boolean> {
    try {
      const dashjs = (await import('dashjs')).default;
      
      this.dashInstance = dashjs.MediaPlayer().create();
      this.dashInstance.initialize(this.videoElement, src, false);

      // Configuration DASH
      this.dashInstance.updateSettings({
        streaming: {
          enableLowLatencyMode: this.config.enableLowLatency,
          lowLatencyEnabled: this.config.enableLowLatency,
          bufferAheadToKeep: this.config.maxBufferLength,
          adaptiveBitrateEnabled: this.config.enableAdaptiveBitrate
        },
        debug: {
          logLevel: 'warn'
        }
      });

      // Événements DASH
      this.dashInstance.on('streamInitialized', () => {
        this.extractDashQualityLevels();
        this.emitEvent('loaded');
      });

      this.dashInstance.on('qualityChangeRendered', (e: any) => {
        const bitrate = e.newQuality;
        this.metrics.currentQuality = this.getQualityFromBitrate(bitrate);
        this.emitEvent('qualityChange', { quality: this.metrics.currentQuality });
      });

      this.dashInstance.on('error', (e: any) => {
        this.emitEvent('error', { message: 'Erreur DASH', error: e });
      });

      this.setupDashMetrics();
      return true;

    } catch (error) {
      console.error('Erreur initialisation DASH:', error);
      return false;
    }
  }

  // Initialiser WebRTC
  private async initializeWebRTC(src: string): Promise<boolean> {
    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      this.webrtcConnection = new RTCPeerConnection(configuration);

      this.webrtcConnection.ontrack = (event) => {
        if (this.videoElement) {
          this.videoElement.srcObject = event.streams[0];
        }
      };

      this.webrtcConnection.oniceconnectionstatechange = () => {
        const state = this.webrtcConnection?.iceConnectionState;
        if (state === 'connected') {
          this.emitEvent('loaded');
        } else if (state === 'failed' || state === 'disconnected') {
          this.emitEvent('error', { message: 'Connexion WebRTC échouée' });
        }
      };

      // Ici, vous ajouteriez la logique de signaling avec votre serveur WebRTC
      // await this.setupWebRTCSignaling(src);

      return true;

    } catch (error) {
      console.error('Erreur initialisation WebRTC:', error);
      return false;
    }
  }

  // Initialiser lecture MP4 standard
  private async initializeMP4(src: string): Promise<boolean> {
    if (this.videoElement) {
      this.videoElement.src = src;
      this.setupNativeEventListeners();
      return true;
    }
    return false;
  }

  // Configurer les écouteurs natifs du navigateur
  private setupNativeEventListeners() {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('loadeddata', () => {
      this.emitEvent('loaded');
    });

    this.videoElement.addEventListener('playing', () => {
      this.metrics.playbackStartTime = Date.now();
      this.emitEvent('playing');
    });

    this.videoElement.addEventListener('pause', () => {
      this.emitEvent('paused');
    });

    this.videoElement.addEventListener('waiting', () => {
      this.metrics.rebufferCount++;
      this.emitEvent('buffering');
    });

    this.videoElement.addEventListener('error', (e) => {
      this.emitEvent('error', { message: 'Erreur de lecture vidéo', error: e });
    });
  }

  // Extraire les niveaux de qualité HLS
  private extractQualityLevels() {
    if (!this.hlsInstance || !this.hlsInstance.levels) return;

    this.qualityLevels = this.hlsInstance.levels.map((level: any, index: number) => ({
      label: `${level.height}p`,
      resolution: `${level.width}x${level.height}`,
      bandwidth: level.bitrate,
      src: level.url[0] || ''
    }));

    // Ajouter l'option auto
    this.qualityLevels.unshift({
      label: 'auto',
      resolution: 'Automatique',
      bandwidth: 0,
      src: ''
    });
  }

  // Extraire les niveaux de qualité DASH
  private extractDashQualityLevels() {
    if (!this.dashInstance) return;

    const bitrateInfoList = this.dashInstance.getBitrateInfoListFor('video');
    
    this.qualityLevels = bitrateInfoList.map((info: any) => ({
      label: `${info.height}p`,
      resolution: `${info.width}x${info.height}`,
      bandwidth: info.bitrate,
      src: ''
    }));

    this.qualityLevels.unshift({
      label: 'auto',
      resolution: 'Automatique',
      bandwidth: 0,
      src: ''
    });
  }

  // Obtenir la qualité à partir du bitrate
  private getQualityFromBitrate(bitrate: number): string {
    if (bitrate > 4000000) return '1080p';
    if (bitrate > 2000000) return '720p';
    if (bitrate > 1000000) return '480p';
    if (bitrate > 500000) return '360p';
    return '240p';
  }

  // Configurer les métriques HLS
  private setupHLSMetrics() {
    if (!this.hlsInstance || !this.config.enableMetrics) return;

    setInterval(() => {
      if (this.hlsInstance) {
        const stats = this.hlsInstance.stats;
        this.metrics.bandwidth = (stats.avgBandwidth || 0) / 1000000; // Mbps
        this.metrics.bufferHealth = this.videoElement?.buffered.length 
          ? this.videoElement.buffered.end(0) - this.videoElement.currentTime 
          : 0;
        this.metrics.droppedFrames = stats.droppedFrames || 0;
      }
    }, 1000);
  }

  // Configurer les métriques DASH
  private setupDashMetrics() {
    if (!this.dashInstance || !this.config.enableMetrics) return;

    setInterval(() => {
      if (this.dashInstance) {
        const dashMetrics = this.dashInstance.getDashMetrics();
        const throughputHistory = dashMetrics.getCurrentHttpRequest('video');
        
        if (throughputHistory) {
          this.metrics.bandwidth = (throughputHistory.trace.reduce((acc: number, trace: any) => 
            acc + trace.b, 0) || 0) / 1000000;
        }

        this.metrics.bufferHealth = this.videoElement?.buffered.length 
          ? this.videoElement.buffered.end(0) - this.videoElement.currentTime 
          : 0;
      }
    }, 1000);
  }

  // Changer manuellement la qualité
  public setQuality(quality: string) {
    switch (this.currentStreamType) {
      case 'hls':
        if (this.hlsInstance) {
          if (quality === 'auto') {
            this.hlsInstance.currentLevel = -1; // Auto
          } else {
            const levelIndex = this.qualityLevels.findIndex(q => q.label === quality);
            if (levelIndex > 0) {
              this.hlsInstance.currentLevel = levelIndex - 1; // -1 car auto est en premier
            }
          }
        }
        break;
      
      case 'dash':
        if (this.dashInstance) {
          if (quality === 'auto') {
            this.dashInstance.setAutoSwitchQualityFor('video', true);
          } else {
            this.dashInstance.setAutoSwitchQualityFor('video', false);
            const qualityIndex = this.qualityLevels.findIndex(q => q.label === quality);
            if (qualityIndex > 0) {
              this.dashInstance.setQualityFor('video', qualityIndex - 1);
            }
          }
        }
        break;
    }

    this.metrics.currentQuality = quality;
    this.emitEvent('qualityChange', { quality });
  }

  // Obtenir les qualités disponibles
  public getAvailableQualities(): StreamQuality[] {
    return this.qualityLevels;
  }

  // Obtenir les métriques actuelles
  public getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  // Activer/désactiver le bitrate adaptatif
  public setAdaptiveBitrate(enabled: boolean) {
    this.isAdaptiveBitrateEnabled = enabled;
    
    switch (this.currentStreamType) {
      case 'hls':
        if (this.hlsInstance) {
          this.hlsInstance.autoLevelEnabled = enabled;
        }
        break;
      
      case 'dash':
        if (this.dashInstance) {
          this.dashInstance.setAutoSwitchQualityFor('video', enabled);
        }
        break;
    }
  }

  // Nettoyer les ressources
  public destroy() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }

    if (this.dashInstance) {
      this.dashInstance.reset();
      this.dashInstance = null;
    }

    if (this.webrtcConnection) {
      this.webrtcConnection.close();
      this.webrtcConnection = null;
    }

    this.eventListeners.clear();
  }
}

export default StreamingService;