
import { db, DayRepository, WeekRepository, SettingsRepository } from './db';
import { DayPlan } from '../types';

export const migrateLegacyData = async () => {
    const legacyStateRaw = localStorage.getItem('kleymo_state_v2');
    if (!legacyStateRaw) return;

    try {
        const legacyState = JSON.parse(legacyStateRaw);
        const hasMigrated = localStorage.getItem('kleymo_migrated_v3');
        if (hasMigrated) return;

        console.log("[MIGRATION] Starting legacy data migration...");

        // 1. Migrate History (Days)
        if (legacyState.history && Array.isArray(legacyState.history)) {
            for (const day of legacyState.history) {
                const mappedDay: DayPlan = {
                    date: day.date,
                    scarcityScore: day.score || 0,
                    escalationLevel: (day.score < 50 ? 2 : 0) as any, // Simplified mapping
                    morningIgnition: { mood: 5, intention: "Legacy Task" },
                    middaySprint: { focusTime: 30, completed: true },
                    eveningHarvest: { wins: [], lessons: [] },
                    domains: {
                        body: { completed: day.score > 80, value: 1, target: 1, label: "Migrated" },
                        meaning: { completed: day.score > 70, value: 1, target: 1, label: "Migrated" },
                        creation: { completed: day.score > 60, value: 1, target: 1, label: "Migrated" },
                        connection: { completed: day.score > 50, value: 1, target: 1, label: "Migrated" },
                        intimacy: { completed: day.score > 40, value: 1, target: 1, label: "Migrated" },
                    },
                    legacy: {
                        plugTime: day.plugTimer || 0,
                        audioTime: 30,
                        humiliationCount: day.humiliationCount || 0,
                    }
                };
                await DayRepository.put(mappedDay);
            }
        }

        // 2. Migrate Current Day
        if (legacyState.currentDay) {
            const day = legacyState.currentDay;
            const mappedCurrent: DayPlan = {
                date: day.date,
                scarcityScore: day.score || 0,
                escalationLevel: 0,
                morningIgnition: { mood: 5, intention: "" },
                middaySprint: { focusTime: 0, completed: false },
                eveningHarvest: { wins: [], lessons: [] },
                domains: {
                    body: { completed: false, value: 0, target: 1, label: "" },
                    meaning: { completed: false, value: 0, target: 1, label: "" },
                    creation: { completed: false, value: 0, target: 1, label: "" },
                    connection: { completed: false, value: 0, target: 1, label: "" },
                    intimacy: { completed: false, value: 0, target: 1, label: "" },
                },
                legacy: {
                    plugTime: day.plugTimer || 0,
                    audioTime: 0,
                    humiliationCount: day.humiliationCount || 0,
                }
            };
            await DayRepository.put(mappedCurrent);
        }

        // 3. Migrate Settings & Streak
        await SettingsRepository.set('streak', legacyState.streak || 0);
        await SettingsRepository.set('lastActiveTime', legacyState.lastActiveTime || Date.now());

        localStorage.setItem('kleymo_migrated_v3', 'true');
        console.log("[MIGRATION] Migration complete.");

    } catch (error) {
        console.error("[MIGRATION] Failed to migrate legacy data:", error);
    }
};
