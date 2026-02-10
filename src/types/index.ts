
export type LifeDomain = 'body' | 'meaning' | 'creation' | 'connection' | 'intimacy';

export interface DayPlan {
    date: string; // ISO YYYY-MM-DD
    scarcityScore: number; // 0-100
    escalationLevel: 0 | 1 | 2 | 3 | 4;

    morningIgnition: {
        mood: number;
        intention: string;
        completedAt?: number;
    };

    middaySprint: {
        focusTime: number; // minutes
        completed: boolean;
    };

    eveningHarvest: {
        wins: string[];
        lessons: string[];
        completedAt?: number;
    };

    domains: Record<LifeDomain, {
        completed: boolean;
        value: number; // e.g. minutes or boolean (0/1)
        target: number;
        label: string; // "100 reps" or "10 mins"
    }>;

    // Legacy compatibility for "Punishments" & "Rituals"
    legacy: {
        plugTime: number;
        audioTime: number;
        humiliationCount: number;
        morningPhotoId?: string;
        eveningPhotoId?: string;
    };
}

export interface WeeklyReview {
    id: string; // YYYY-Wxx
    startDate: string;
    roles: {
        ceo: string;   // Strategy
        coach: string; // Correction/Tactics
        lover: string; // Self-care/Reward
    };
    ruleOfTheWeek: string;
    socialRitual: string;
    violations: string[];
    completedAt?: number;
}

export interface MonthlySeason {
    id: string; // YYYY-MM
    theme: string;
    identityShift: string;
    bRollId?: string; // Blob ID
    completedAt?: number;
}

export interface AppSettings {
    key: string;
    value: any;
}

// Persona and Settings Types
export type PersonaId = 'supportive' | 'neutral' | 'strict';

export interface PersonaProfile {
    id: PersonaId;
    nameKey: string; // i18n key
    sampleKey: string; // i18n key
    style: {
        warmth: number; // 0-100
        directness: number; // 0-100
        formality: number; // 0-100
    };
    tts: {
        lang: string;
        rate: number;
        pitch: number;
    };
}

export interface UserSettings {
    version: number;
    personaId: PersonaId;
    speechEnabled: boolean;
    intenseModeEnabled: boolean;
    language: string;
    customTTS?: {
        rate: number;
        pitch: number;
    };
}
