import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import ruCommon from './locales/ru/common.json';
import heCommon from './locales/he/common.json';
import swCommon from './locales/sw/common.json';
import deCommon from './locales/de/common.json';
import urCommon from './locales/ur/common.json';

const RTL_LANGUAGES = ['he', 'ur'];

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: enCommon },
            fr: { common: frCommon },
            ru: { common: ruCommon },
            he: { common: heCommon },
            sw: { common: swCommon },
            de: { common: deCommon },
            ur: { common: urCommon },
        },
        fallbackLng: 'en',
        defaultNS: 'common',
        supportedLngs: ['en', 'fr', 'ru', 'he', 'sw', 'de', 'ur'],
        interpolation: {
            escapeValue: false,
        },
    });

// Apply RTL direction
i18n.on('languageChanged', (lng) => {
    const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
});

// Set initial direction
const currentLang = i18n.language;
const initialDir = RTL_LANGUAGES.includes(currentLang) ? 'rtl' : 'ltr';
document.documentElement.dir = initialDir;
document.documentElement.lang = currentLang;

export default i18n;
