
export interface BreathingMetrics {
    volume: number;      // 0.0 - 1.0 (approximated from RMS)
    isBreathing: boolean;
    bpm: number;         // Estimated Breaths Per Minute
    raw: number[];       // FFT or Time domain data for visualization
}

export type BreathingMode = '1' | '2';

class AudioMonitorService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private processingInterval: number | null = null;
    
    // Breathing Detection State
    private volumeHistory: number[] = [];
    private lastPeakTime: number = 0;
    private breathTimes: number[] = [];
    
    public callbacks: ((metrics: BreathingMetrics) => void)[] = [];

    // Mode configurations
    private mode: BreathingMode = '1';
    private sensitivity = 0.02; // Threshold for "isBreathing"

    constructor() {}

    public setMode(mode: BreathingMode) {
        this.mode = mode;
        // Adjust sensitivity for 2 people (might be noisier/more constant signal)
        this.sensitivity = mode === '1' ? 0.02 : 0.015; 
        console.log(`[AUDIO] Mode set to: ${mode} Persons`);
    }

    public async startListening(): Promise<boolean> {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                return true;
            }
            if (this.stream) return true; // Already running

            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            
            // Configuration for breathing (low frequency focus preferably)
            this.analyser.fftSize = 2048; 
            this.analyser.smoothingTimeConstant = 0.8;

            this.microphone.connect(this.analyser);
            // DO NOT connect to destination (speakers) to avoid feedback loop!

            this.startAnalysisLoop();
            console.log("[AUDIO] Listening started");
            return true;

        } catch (error) {
            console.error("[AUDIO] Permission denied or error:", error);
            return false;
        }
    }

    public stopListening() {
        if (this.processingInterval) clearInterval(this.processingInterval);
        if (this.microphone) this.microphone.disconnect();
        if (this.analyser) this.analyser.disconnect();
        if (this.stream) this.stream.getTracks().forEach(track => track.stop());
        if (this.audioContext) this.audioContext.close();

        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.processingInterval = null;
    }

    public subscribe(callback: (metrics: BreathingMetrics) => void) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    private startAnalysisLoop() {
        // Run analysis roughly 30 times a second
        this.processingInterval = window.setInterval(() => {
            this.analyze();
        }, 33);
    }

    private analyze() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        // 1. Calculate RMS (Volume)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const x = (dataArray[i] - 128) / 128.0;
            sum += x * x;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // 2. Smooth volume for breath detection
        // Simple moving average could go here, but we use a direct threshold check first
        const isBreathing = rms > this.sensitivity;

        // 3. Peak Detection for BPM
        const now = Date.now();
        if (isBreathing && rms > (this.sensitivity * 1.5)) {
             // If this is a new peak (sufficient time since last)
             if (now - this.lastPeakTime > 1500) { // Assume max 40 breaths/min (1500ms gap)
                 this.breathTimes.push(now);
                 this.lastPeakTime = now;
                 
                 // Keep last 5 breaths
                 if (this.breathTimes.length > 5) this.breathTimes.shift();
             }
        }

        // Calculate BPM
        let bpm = 0;
        if (this.breathTimes.length >= 2) {
            const duration = this.breathTimes[this.breathTimes.length - 1] - this.breathTimes[0];
            const avgDiff = duration / (this.breathTimes.length - 1);
            bpm = Math.round(60000 / avgDiff);
        }

        // Limit data array size for UI
        const visualData = Array.from(dataArray).filter((_, i) => i % 8 === 0); // Downsample

        const metrics: BreathingMetrics = {
            volume: rms,
            isBreathing,
            bpm,
            raw: visualData
        };

        this.callbacks.forEach(cb => cb(metrics));
    }
}

export const audioMonitor = new AudioMonitorService();
