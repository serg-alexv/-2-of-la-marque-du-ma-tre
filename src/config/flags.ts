// Feature flags configuration
export const FLAGS = {
    // Intense mode capability - must be explicitly enabled via env var
    // Set VITE_INTENSE_CAPABLE=1 in .env.local for private builds
    canUseIntenseMode: import.meta.env.VITE_INTENSE_CAPABLE === '1',
} as const;

export function isIntenseModeAvailable(): boolean {
    return FLAGS.canUseIntenseMode;
}
