

export const speak = (text: string, force = false) => {
    console.log(`[SPEAK START] Text: "${text}"`);

    if (!window.speechSynthesis) {
        console.warn("[SPEAK ERROR] SpeechSynthesis not supported");
        return;
    }

    const synth = window.speechSynthesis;

    try {
        if (force && synth.speaking) {
            console.log("[SPEAK] Canceling previous speech");
            synth.cancel();
        }

        const utter = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = synth.getVoices();

            // Aggressive voice selection strategy:
            // Prioritize Russian Male voices
            let voice = voices.find(v => v.lang.startsWith('ru') && (
                v.name.toLowerCase().includes('pavel') ||
                v.name.toLowerCase().includes('yuri') ||
                v.name.toLowerCase().includes('denis') ||
                v.name.toLowerCase().includes('dmitry') ||
                v.name.toLowerCase().includes('male')
            ));

            if (!voice) {
                voice = voices.find(v => v.lang.startsWith('ru') && !v.name.toLowerCase().includes('google'));
            }

            if (!voice) {
                voice = voices.find(v => v.lang.startsWith('ru'));
            }

            if (voice) {
                console.log(`[SPEAK] Voice selected: ${voice.name}`);
                utterance.voice = voice;
            }

            utterance.pitch = 0.8;
            utterance.rate = 1.1;
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
