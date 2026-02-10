import { create } from 'zustand';
import { UserSettings, PersonaId } from '@/types';
import { loadSettings, saveSettings } from '@/lib/storage';
import i18n from '@/i18n';

interface SettingsState extends UserSettings {
    // Actions
    setPersona: (personaId: PersonaId) => void;
    setSpeechEnabled: (enabled: boolean) => void;
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
