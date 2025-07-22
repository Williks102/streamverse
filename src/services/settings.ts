// src/services/settings.ts - Service de gestion des paramètres
interface SiteSettings {
  commissionRate: number;
  siteName: string;
  maintenanceMode: boolean;
}

// Clé pour le localStorage
const SETTINGS_KEY = 'streamverse_site_settings';

// Paramètres par défaut
const DEFAULT_SETTINGS: SiteSettings = {
  commissionRate: 20,
  siteName: 'StreamVerse',
  maintenanceMode: false,
};

export class SettingsService {
  // Récupérer les paramètres depuis le localStorage
  static getSettings(): SiteSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Erreur lors de la lecture des paramètres:', error);
    }

    return DEFAULT_SETTINGS;
  }

  // Sauvegarder les paramètres dans le localStorage
  static saveSettings(settings: SiteSettings): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      const event = new CustomEvent('settingsUpdated', { 
        detail: settings 
      });
      window.dispatchEvent(event);
      
      console.log('✅ Paramètres sauvegardés:', settings);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  }

  // Mettre à jour seulement le taux de commission
  static updateCommissionRate(newRate: number): boolean {
    const currentSettings = this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      commissionRate: newRate
    };
    return this.saveSettings(updatedSettings);
  }

  // Récupérer seulement le taux de commission
  static getCommissionRate(): number {
    return this.getSettings().commissionRate;
  }

  // Écouter les changements de paramètres
  static onSettingsChange(callback: (settings: SiteSettings) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<SiteSettings>;
      callback(customEvent.detail);
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    // Retourner une fonction de nettoyage
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }

  // Réinitialiser aux paramètres par défaut
  static resetToDefaults(): boolean {
    return this.saveSettings(DEFAULT_SETTINGS);
  }

  // Calculer les commissions gagnées basées sur un revenu
  static calculateCommissionEarned(totalRevenue: number): number {
    const rate = this.getCommissionRate();
    return totalRevenue * (rate / 100);
  }
}

// Export du type pour utilisation dans d'autres fichiers
export type { SiteSettings };