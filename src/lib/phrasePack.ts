// Phrase pack validation and storage

export interface PhrasePackSchema {
    version: 1;
    locale: 'en' | 'fr' | 'ru' | 'he' | 'sw' | 'de' | 'ur';
    phrases: Record<string, string>;
}

// Allowed phrase keys that can be imported
const ALLOWED_PHRASE_KEYS = [
    'persona.sample_supportive',
    'persona.sample_neutral',
    'persona.sample_strict',
    'overlay.fail_state_title',
    'overlay.fail_state_body',
];

// Basic denylist patterns - should be extended with comprehensive list
// DO NOT include actual slurs in code - use pattern matching
const DENYLIST_PATTERNS = [
    // Placeholder patterns - extend with actual validation
    /\b(placeholder1|placeholder2)\b/i,
    // Add more patterns as needed
];

const STORAGE_KEY = 'phrase_pack_imports';
const MAX_PHRASE_LENGTH = 500;

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validatePhrasePack(pack: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Schema validation
    if (!pack || typeof pack !== 'object') {
        errors.push('Invalid JSON structure');
        return { valid: false, errors, warnings };
    }

    if (pack.version !== 1) {
        errors.push('Unsupported version');
    }

    const validLocales = ['en', 'fr', 'ru', 'he', 'sw', 'de', 'ur'];
    if (!validLocales.includes(pack.locale)) {
        errors.push(`Invalid locale: ${pack.locale}`);
    }

    if (!pack.phrases || typeof pack.phrases !== 'object') {
        errors.push('Missing or invalid phrases object');
        return { valid: false, errors, warnings };
    }

    // Validate each phrase
    for (const [key, value] of Object.entries(pack.phrases)) {
        // Check if key is allowed
        if (!ALLOWED_PHRASE_KEYS.includes(key)) {
            warnings.push(`Key "${key}" is not in allowed list, will be ignored`);
            continue;
        }

        // Check value type and length
        if (typeof value !== 'string') {
            errors.push(`Phrase "${key}" must be a string`);
            continue;
        }

        if (value.length > MAX_PHRASE_LENGTH) {
            errors.push(`Phrase "${key}" exceeds maximum length of ${MAX_PHRASE_LENGTH}`);
            continue;
        }

        // Content validation - check for problematic patterns
        for (const pattern of DENYLIST_PATTERNS) {
            if (pattern.test(value)) {
                errors.push(`Phrase "${key}" contains prohibited content`);
                break;
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

export function importPhrasePack(pack: PhrasePackSchema): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const imports = stored ? JSON.parse(stored) : {};

        // Store phrases by locale
        if (!imports[pack.locale]) {
            imports[pack.locale] = {};
        }

        // Merge only allowed keys
        for (const key of ALLOWED_PHRASE_KEYS) {
            if (pack.phrases[key]) {
                imports[pack.locale][key] = pack.phrases[key];
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(imports));
    } catch (error) {
        console.error('[PhrasePack] Failed to import:', error);
        throw new Error('Failed to save phrase pack');
    }
}

export function getImportedPhrases(locale: string): Record<string, string> | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const imports = JSON.parse(stored);
        return imports[locale] || null;
    } catch (error) {
        console.error('[PhrasePack] Failed to load:', error);
        return null;
    }
}

export function clearImportedPhrases(locale?: string): void {
    try {
        if (!locale) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const imports = JSON.parse(stored);
        delete imports[locale];

        if (Object.keys(imports).length === 0) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(imports));
        }
    } catch (error) {
        console.error('[PhrasePack] Failed to clear:', error);
    }
}
