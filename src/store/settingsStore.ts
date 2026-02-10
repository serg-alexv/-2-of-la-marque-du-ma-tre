import { create } from 'zustand';
import { UserSettings, PersonaId } from '@/types';
import { loadSettings, saveSettings } from '@/lib/storage';
import { isIntenseModeAvailable } from '@/config/flags';
import i18n from '@/i18n';

interface SettingsState extends UserSettings {
    // Actions
    setPersona: (personaId: PersonaId) => void;
    setSpeechEnabled: (enabled: boolean) => void;
    setIntenseMode: (enabled: boolean) => void;
    setLanguage: (lang: string) => void;
    setCustomTTS: (rate: number, pitch: number) => void;
    initialize: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...loadSettings(),

    initialize: () => {
        const settings = loadSettings();
        set(settings);

        // Sync language with i18n
        if (settings.language && i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
        }
    },

    setPersona: (personaId) => {
        set({ personaId });
        saveSettings(get());
    },

    setSpeechEnabled: (enabled) => {
        set({ speechEnabled: enabled });
        saveSettings(get());
    },

    setIntenseMode: (enabled) => {
        // Only allow enabling if feature flag is on
        if (enabled && !isIntenseModeAvailable()) {
            console.warn('[Settings] Intense mode not available in this build');
            return;
        }
        set({ intenseModeEnabled: enabled });
        saveSettings(get());
    },

    setLanguage: (lang) => {
        set({ language: lang });
        i18n.changeLanguage(lang);
        saveSettings(get());
    },

    setCustomTTS: (rate, pitch) => {
        set({ customTTS: { rate, pitch } });
        saveSettings(get());
    },
}));
