import { PersonaProfile, PersonaId } from '@/types';

export const DEFAULT_PERSONAS: Record<PersonaId, PersonaProfile> = {
    supportive: {
        id: 'supportive',
        nameKey: 'persona.supportive',
        sampleKey: 'persona.sample_supportive',
        style: {
            warmth: 80,
            directness: 40,
            formality: 30,
        },
        tts: {
            lang: 'en-US',
            rate: 1.0,
            pitch: 1.1,
        },
    },
    neutral: {
        id: 'neutral',
        nameKey: 'persona.neutral',
        sampleKey: 'persona.sample_neutral',
        style: {
            warmth: 50,
            directness: 60,
            formality: 60,
        },
        tts: {
            lang: 'en-US',
            rate: 1.1,
            pitch: 1.0,
        },
    },
    strict: {
        id: 'strict',
        nameKey: 'persona.strict',
        sampleKey: 'persona.sample_strict',
        style: {
            warmth: 20,
            directness: 90,
            formality: 80,
        },
        tts: {
            lang: 'ru-RU',
            rate: 1.3,
            pitch: 0.9,
        },
    },
};

export function getActivePersona(personaId: PersonaId): PersonaProfile {
    return DEFAULT_PERSONAS[personaId];
}
