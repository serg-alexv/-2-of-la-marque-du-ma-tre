# AI Summary: La Marque du Maître

**Type**: Interactive Gamified Discipline/BDSM Tracker (Web App).
**Stack**: React + Vite + TypeScript. No Backend (Local Storage).

## Core Mechanics
1.  **Tracker**: Daily tasks (Rituals, Plugging, Audio) -> Score (0-100).
2.  **Logic**: Score < 70 = Punishment. Score > 90 = Safety.
3.  **Surveillance**:
    *   **Audio**: "Always Listening" (AudioContext). Detects breathing via RMS/FFT.
    *   **Visual**: Oscilloscope (time-domain) + BPM estimation.
    *   **Voice**: Speech Recognition (Web Speech API). Commands: "Yes", "Master", "Sorry", "No".
    *   **Enforcement**: 15s Silence = Warning. 25s Silence = Penalty.
4.  **UI/HMI**: Dark aesthetic, aggressive overlays, TTS feedback (Male Russian Voice).

## Key Files
*   `App.tsx`: Main monolithic state & game loop.
*   `services/audio.ts`: `AudioContext` wrapper, RMS & BPM calc.
*   `services/speech.ts`: `webkitSpeechRecognition` wrapper.
*   `components/BreathingMonitor.tsx`: Oscilloscope visualization & "Pacer" overlay.

## Current status
*   **Implemented**: Breathing Monitor, Voice Recognition, Basic Punishment Logic, Pacer Overlay.
*   **Roadmap**: P2P Remote Control, Refactoring monolith `App.tsx`.
