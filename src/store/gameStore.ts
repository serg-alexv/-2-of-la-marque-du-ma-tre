
import { create } from 'zustand';
import { DayRepository } from '../lib/db';
import { DayPlan } from '../types';
import { format } from 'date-fns';

interface GameState {
    currentDay: DayPlan | null;
    score: number;
    xp: number;
    escalationLevel: 0 | 1 | 2 | 3 | 4;
    showOverlay: string | null;
    interactionRequired: boolean;

    // Actions
    initialize: () => Promise<void>;
    updateDay: (updates: Partial<DayPlan>) => Promise<void>;
    calculateEscalation: (day: DayPlan) => void;
    triggerOverlay: (type: 'pacer' | 'voice' | 'locked') => void;
    clearOverlay: () => void;
    setInteractionRequired: (val: boolean) => void;
}

const INITIAL_DAY_TEMPLATE = (date: string): DayPlan => ({
    date,
    scarcityScore: 100,
    escalationLevel: 0,
    morningIgnition: { mood: 5, intention: '' },
    middaySprint: { focusTime: 0, completed: false },
    eveningHarvest: { wins: [], lessons: [] },
    domains: {
        body: { completed: false, value: 0, target: 1, label: 'Физическая Тренировка' },
        meaning: { completed: false, value: 0, target: 1, label: 'Чтение / Медитация' },
        creation: { completed: false, value: 0, target: 1, label: 'Глубокая Работа' },
        connection: { completed: false, value: 0, target: 1, label: 'Социум / Окружение' },
        intimacy: { completed: false, value: 0, target: 1, label: 'Близость / Свой-Чужой' },
    },
    legacy: {
        plugTime: 0,
        audioTime: 0,
        humiliationCount: 0,
    }
});

export const useGameStore = create<GameState>((set, get) => ({
    currentDay: null,
    score: 100,
    xp: 0,
    escalationLevel: 0,
    showOverlay: null,
    interactionRequired: true,

    initialize: async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        let day = await DayRepository.get(today);

        if (!day) {
            // New Day: Check consistency from yesterday (optional logic)
            day = INITIAL_DAY_TEMPLATE(today);
            await DayRepository.put(day);
        }

        set({
            currentDay: day,
            score: day.scarcityScore,
            escalationLevel: day.escalationLevel
        });
    },

    updateDay: async (updates) => {
        const { currentDay, calculateEscalation } = get();
        if (!currentDay) return;

        const newDay = { ...currentDay, ...updates };

        // Granular Scoring System
        let newScore = 0;

        // Base domain completion: 20 points per domain (max 100)
        const domainValues = Object.values(newDay.domains);
        const completedCount = domainValues.filter(d => d.completed).length;
        newScore += completedCount * 20;

        // Ritual bonuses
        if (newDay.morningIgnition.completedAt) newScore += 20; // Morning ritual
        if (newDay.legacy.morningPhotoId) newScore += 25; // Photo upload
        if (newDay.legacy.plugTime >= 36000) newScore += 20; // Plug 10+ hours (36000 seconds)
        if (newDay.legacy.audioTime >= 1800) newScore += 15; // Audio 30+ min (1800 seconds)
        if (newDay.legacy.humiliationCount >= 50) newScore += 10; // Humiliations 50+
        if (newDay.eveningHarvest.completedAt) newScore += 10; // Evening ritual

        // Cap at 100
        newScore = Math.min(100, newScore);
        newDay.scarcityScore = newScore;

        // Check for penalty (score < 70)
        const previousScore = currentDay.scarcityScore;
        if (newScore < 70 && previousScore >= 70) {
            // Trigger TTS penalty (imported dynamically to avoid circular deps)
            const { speak } = await import('@/lib/services/tts');
            const { PHRASES } = await import('@/lib/constants');
            const penaltyText = `Ты провалилась, мразь. Score ${newScore}. Штраф: удвоить завтра.`;
            speak(penaltyText, true);
        }

        // Check Escalation
        calculateEscalation(newDay);

        // Save
        await DayRepository.put(newDay);
        set({ currentDay: newDay, score: newScore });
    },

    calculateEscalation: (day) => {
        let level: 0 | 1 | 2 | 3 | 4 = 0;

        // Example Logic
        if (day.scarcityScore < 70) level = 1;
        if (day.scarcityScore < 50) level = 2;
        if (day.scarcityScore < 30) level = 3;
        if (day.scarcityScore < 10) level = 4;

        set({ escalationLevel: level });
    },

    triggerOverlay: (type) => set({ showOverlay: type }),
    clearOverlay: () => set({ showOverlay: null }),
    setInteractionRequired: (val) => set({ interactionRequired: val }),
}));
