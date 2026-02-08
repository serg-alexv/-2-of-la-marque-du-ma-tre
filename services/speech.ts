
// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

class SpeechService {
    private recognition: SpeechRecognition | null = null;
    private isListening: boolean = false;
    private callbacks: ((text: string) => void)[] = [];

    constructor() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            if (this.recognition) {
                this.recognition.continuous = true; // Keep listening
                this.recognition.interimResults = false;
                this.recognition.lang = 'ru-RU'; // Russian default

                this.recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const lastResult = event.results[event.results.length - 1];
                    if (lastResult.isFinal) {
                        const text = lastResult[0].transcript.trim();
                        console.log(`[SPEECH] Recognized: "${text}"`);
                        this.notify(text);
                    }
                };

                this.recognition.onerror = (event: any) => {
                    console.error('[SPEECH] Error:', event.error);
                };

                this.recognition.onend = () => {
                    // Auto-restart if we intended to listen
                    if (this.isListening) {
                        console.log('[SPEECH] Restarting...');
                        try {
                            this.recognition?.start();
                        } catch (e) {
                            console.warn("[SPEECH] Restart failed", e);
                        }
                    }
                };
            }
        } else {
            console.warn('[SPEECH] Browser does not support Speech Recognition');
        }
    }

    public start() {
        if (!this.recognition) return;
        if (this.isListening) return;

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('[SPEECH] Listening started');
        } catch (e) {
            console.error('[SPEECH] Start error', e);
        }
    }

    public stop() {
        if (!this.recognition) return;
        this.isListening = false;
        this.recognition.stop();
        console.log('[SPEECH] Listening stopped');
    }

    public subscribe(callback: (text: string) => void) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    private notify(text: string) {
        this.callbacks.forEach(cb => cb(text));
    }
}

export const speechService = new SpeechService();
