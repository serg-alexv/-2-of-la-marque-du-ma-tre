
import Dexie, { Table } from 'dexie';
import { DayPlan, WeeklyReview, MonthlySeason, AppSettings } from '../types';

class ResilienceDB extends Dexie {
    days!: Table<DayPlan, string>;
    weeks!: Table<WeeklyReview, string>;
    months!: Table<MonthlySeason, string>;
    settings!: Table<AppSettings, string>;
    photos!: Table<{ id: string; data: string }, string>;

    constructor() {
        super('ResilienceDB_v3');
        this.version(1).stores({
            days: 'date, scarcityScore, escalationLevel',
            weeks: 'id, startDate',
            months: 'id',
            settings: 'key',
            photos: 'id'
        });
    }
}

export const db = new ResilienceDB();

// --- Typed Repositories ---

export const DayRepository = {
    get: async (date: string) => db.days.get(date),
    put: async (plan: DayPlan) => db.days.put(plan),
    getAll: async () => db.days.toArray(),
    getRange: async (start: string, end: string) =>
        db.days.where('date').between(start, end, true, true).toArray(),
};

export const WeekRepository = {
    get: async (id: string) => db.weeks.get(id),
    put: async (review: WeeklyReview) => db.weeks.put(review),
};

export const MonthRepository = {
    get: async (id: string) => db.months.get(id),
    put: async (review: MonthlySeason) => db.months.put(review),
};

export const SettingsRepository = {
    get: async (key: string) => (await db.settings.get(key))?.value,
    set: async (key: string, value: any) => db.settings.put({ key, value }),
};

export const PhotoRepository = {
    save: async (id: string, data: string) => db.photos.put({ id, data }),
    get: async (id: string) => (await db.photos.get(id))?.data || null,
    delete: async (id: string) => db.photos.delete(id),
};
