
export const speak = (text: string, force = false) => {
    if (!window.speechSynthesis) return;

    // Optional: Cancel previous speech if force is true
    if (force) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9; // Slightly slower for authority
    utterance.pitch = 0.8; // Lower pitch for male-like resonance

    // Find a good Russian voice if available
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.includes('ru'));
    if (ruVoice) {
        utterance.voice = ruVoice;
    }

    window.speechSynthesis.speak(utterance);
};
