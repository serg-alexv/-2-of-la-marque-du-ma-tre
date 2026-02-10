
import { useSettingsStore } from '@/store/settingsStore';
import { getActivePersona } from '@/lib/personas';

export const speak = (text: string, force = false, rate?: number, pitch?: number) => {
    console.log(`[SPEAK START] Text: "${text}"`);

    if (!window.speechSynthesis) {
        console.warn("[SPEAK ERROR] SpeechSynthesis not supported");
        return;
    }

    const synth = window.speechSynthesis;

    // Get settings from store
    const settings = useSettingsStore.getState();
    if (!settings.speechEnabled) {
        console.log("[SPEAK] Speech disabled in settings");
        return;
    }

    const persona = getActivePersona(settings.personaId);
    const effectiveRate = rate ?? settings.customTTS?.rate ?? persona.tts.rate;
    const effectivePitch = pitch ?? settings.customTTS?.pitch ?? persona.tts.pitch;

    try {
        if (force && synth.speaking) {
            console.log("[SPEAK] Canceling previous speech");
            synth.cancel();
        }

        const utter = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = synth.getVoices();

            // Try to find voice matching persona language
            let voice = voices.find(v => v.lang.startsWith(persona.tts.lang.split('-')[0]));

            if (!voice) {
                voice = voices.find(v => v.lang.startsWith('en'));
            }

            if (voice) {
                console.log(`[SPEAK] Voice selected: ${voice.name}`);
                utterance.voice = voice;
            }

            utterance.pitch = effectivePitch;
            utterance.rate = effectiveRate;
            utterance.volume = 1.0;

            utterance.onstart = () => console.log("[SPEAK EVENT] Started");
            utterance.onend = () => console.log("[SPEAK EVENT] Ended");

            synth.speak(utterance);
        };

        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', utter, { once: true });
        } else {
            utter();
        }
    } catch (e) {
        console.error("[SPEAK EXCEPTION]", e);
    }
};
