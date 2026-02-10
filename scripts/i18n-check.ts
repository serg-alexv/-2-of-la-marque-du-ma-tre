import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const LANGUAGES = ['en', 'fr', 'ru', 'he', 'sw', 'de', 'ur'];
const NAMESPACES = ['common'];

function flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(flattenKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function checkI18nKeys() {
    let hasErrors = false;

    for (const ns of NAMESPACES) {
        console.log(`\nChecking namespace: ${ns}`);

        // Load reference (English) keys
        const enPath = path.join(LOCALES_DIR, 'en', `${ns}.json`);
        const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
        const enKeys = flattenKeys(enContent).sort();

        console.log(`  Reference (en): ${enKeys.length} keys`);

        // Check all other languages
        for (const lang of LANGUAGES) {
            if (lang === 'en') continue;

            const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);

            if (!fs.existsSync(langPath)) {
                console.error(`  ❌ ${lang}: File missing`);
                hasErrors = true;
                continue;
            }

            const langContent = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
            const langKeys = flattenKeys(langContent).sort();

            // Check for missing keys
            const missingKeys = enKeys.filter(k => !langKeys.includes(k));
            const extraKeys = langKeys.filter(k => !enKeys.includes(k));

            if (missingKeys.length > 0 || extraKeys.length > 0) {
                console.error(`  ❌ ${lang}: Key mismatch`);
                if (missingKeys.length > 0) {
                    console.error(`     Missing: ${missingKeys.join(', ')}`);
                }
                if (extraKeys.length > 0) {
                    console.error(`     Extra: ${extraKeys.join(', ')}`);
                }
                hasErrors = true;
            } else {
                console.log(`  ✅ ${lang}: ${langKeys.length} keys`);
            }
        }
    }

    if (hasErrors) {
        console.error('\n❌ i18n key validation failed');
        process.exit(1);
    } else {
        console.log('\n✅ All i18n keys are synchronized');
    }
}

checkI18nKeys();
