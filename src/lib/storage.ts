import { UserSettings, PersonaId } from '@/types';
import { isIntenseModeAvailable } from '@/config/flags';

const STORAGE_KEY = 'user_settings';
const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: UserSettings = {
    version: CURRENT_VERSION,
    personaId: 'neutral',
    speechEnabled: true,
    intenseModeEnabled: false,
    language: 'en',
};

export function loadSettings(): UserSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_SETTINGS;

        const parsed = JSON.parse(stored) as UserSettings;

        // Version migration (future-proof)
        if (parsed.version !== CURRENT_VERSION) {
            console.warn('[Storage] Version mismatch, using defaults');
            return DEFAULT_SETTINGS;
        }

        // Force intense mode off if not available via feature flag
        if (!isIntenseModeAvailable()) {
            parsed.intenseModeEnabled = false;
        }

        return parsed;
    } catch (error) {
        console.error('[Storage] Failed to load settings:', error);
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: UserSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('[Storage] Failed to save settings:', error);
    }
}
