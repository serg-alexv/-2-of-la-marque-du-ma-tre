# Project Description: La Marque du Maître (The Master's Mark)

## 1. Project Overview
**La Marque du Maître** is a gamified, high-discipline lifestyle application designed with a dark, dominant/submissive thematic aesthetic. It functions as a strict interactive tracker for daily rituals, physical tasks, and behavioral conditioning. The app uses aggressive psychological reinforcement (rewards/punishments) and relies heavily on "Always Listening" audio technology to enforce presence and obedience.

**Core Philosophy:**
*   **Total Control:** The app demands permissions (Notification, Mic) and tracks user presence/activity.
*   **Gamification of Suffering:** Users earn points for completing uncomfortable or disciplined tasks.
*   **Interactive Surveillance:** The app "listens" to the user and monitors their breathing, creating a sense of constant observation.

## 2. Implemented Functions

### A. Core Rituals & Tracking (Dashboard)
*   **Morning Ritual:** Checkbox and Photo Upload for "Morning Mark" (Verification).
*   **Plug Time (Filling):** Timer-based task with variable targets based on "Multiplier" difficulty.
*   **Audio Session (Programming):** Timer for required listening tasks.
*   **Humiliation Counter:** Manual counter to track daily "humiliations".
*   **Evening Ritual:** "Orgasm Permission" logic (locked/unlocked based on score) and proof upload.

### B. Game Mechanics
*   **Scoring System:** Daily score (0-100). <70 results in punishment. >90 results in "survival".
*   **Multipliers (`x1`, `x1.5`, `x2`):** Difficulty scales based on previous failures or "Sunday Judgment".
*   **Streaks:** Tracks consecutive days of obedience.
*   **Punishments:** Random text-based punishments and "Orgasm Lock" (timer blocking functionality).
*   **Sunday Judgment:** Weekly average calculation. If Avg < 75, next week gets `x1.5` difficulty.

### C. Audio & Voice Module
*   **Always Listening:** The app connects to the microphone immediately on load.
    *   *Technical:* `AudioContext` + `MediaStreamSource`.
*   **Breathing Monitor:**
    *   **Analysis:** Real-time RMS (Volume) and Peak Detection (BPM).
    *   **Visualization:** Oscilloscope-style graph.
    *   **Modes:** Support for 1 Person or 2 Persons (Synchronized).
*   **Voice Recognition (STT):**
    *   **Commands:** Recognizes specific keywords ("Да", "Хозяин", "Прости", "Нет").
    *   **Interaction:** Positive answers reduce penalty; negative answers increase it.
    *   *Technical:* `window.SpeechRecognition` (Web Speech API).

### D. Interactive Enforcement
*   **Apnea Detection:** If the user stops breathing (silence) for >15s, the app warns via TTS ("ДЫШИ!"). If >25s, it applies a penalty.
*   **Peacemaker Overlay:** Fullscreen "Practice Mode" with a rhythmic visual guide (4-2-4 breathing) to teach control.
*   **Permission Blockers:** Aggressive full-screen overlays force the user to grant Notification and Microphone permissions.
*   **Anti-Cheat/Anti-Leave:** Detects tab switching (`visibilitychange`) and threatens/punishes the user for leaving.

### E. Output & Reports
*   **HTML Export:** Generates a downloadable, watermarked HTML report of the user's history and photos.
*   **TTS (Text-to-Speech):** "The Master's Voice" speaks feedback, insults, and commands using the browser's synthesis API (preferring Russian male voices).

## 3. Internal Technical Details

### Architecture
*   **Frontend-Only:** Built with **React 18** and **Vite**. No backend server (data is local).
*   **State Management:** Monolithic `useState` in `App.tsx` (Needs refactoring).
*   **Persistence:** `localStorage` ('kleymo_state_v2').

### Key Services
1.  **`services/audio.ts` (AudioMonitor)**:
    *   Handles `AudioContext` lifecycle.
    *   Performs time-domain analysis (`getByteTimeDomainData`) for breathing detection.
    *   Sensitivity threshold: `0.02` RMS.
2.  **`services/speech.ts` (SpeechService)**:
    *   Wraps `webkitSpeechRecognition`.
    *   configured for `continuous: true` and `lang: 'ru-RU'`.
    *   Auto-restarts on `onend` to maintain "always listening" state.
3.  **`utils.ts`**:
    *   Contains game logic (`calculateScore`), asset helpers, and the "Dictionary of Hate" (text corpus).

### File Structure
```
/src
  /components
    BreathingMonitor.tsx  # Oscilloscope & Pacer Overlay
    Counter.tsx           # Numeric input
    PhotoUpload.tsx       # Image handler (Base64)
    Timer.tsx             # Countdown logic
  /services
    audio.ts              # Mic analysis
    speech.ts             # Voice recognition
  App.tsx                 # Main Logic Controller
  utils.ts                # Helpers & Math
  types.ts                # TS Interfaces
```

## 4. Scheduled / Planned Functions (Roadmap)

### Immediate (Refactoring)
*   **State Split:** Extract `App.tsx` logic into `GameContext`, `AudioContext`, and `UserContext` to improve maintainability.
*   **Component Modularization:** Move "Overlays" (Permission, Judgment, Voice) into separate components.

### Feature Expansion
*   **P2P Remote Control:** Allow a remote "Master" to view the breathing graph and trigger punishments in real-time (WebRTC).
*   **Advanced Biometrics:** Integration with smart watches (Heart Rate) via Web Bluetooth (if supported).
*   **Facial Recognition:** Verify the user is looking at the screen (TensorFlow.js).
