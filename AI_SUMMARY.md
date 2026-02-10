# AI Summary: La Marque du Maître

## Recent Changes (2026-02-10)

### Three PRs Implemented: CI + i18n + Personas

#### PR-0: GitHub Actions CI Pipeline

- Created `.github/workflows/ci.yml` with typecheck, build, and i18n validation
- Added `typecheck` script to `package.json`
- CI runs on push to main and pull requests

#### PR-1: Internationalization (7 Languages + RTL)

- Installed `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- Created `src/i18n/index.ts` with language detection and RTL support
- Added 7 locale files: en, fr, ru, de (full translations), he, sw, ur (TODO placeholders)
- RTL automatically enabled for Hebrew and Urdu
- Created `scripts/i18n-check.ts` to validate key synchronization across all locales
- Added `i18n:check` script and CI step

#### PR-A: Personas + Settings UI + TTS Preview

- Added persona types to `src/types/index.ts`: `PersonaId`, `PersonaProfile`, `UserSettings`
- Created `src/lib/personas.ts` with 3 default personas:
  - **Supportive**: Warmth 80, Directness 40, Formality 30 (en-US, rate 1.0, pitch 1.1)
  - **Neutral**: Warmth 50, Directness 60, Formality 60 (en-US, rate 1.1, pitch 1.0)
  - **Strict**: Warmth 20, Directness 90, Formality 80 (ru-RU, rate 1.3, pitch 0.9)
- Created `src/lib/storage.ts` for localStorage persistence with schema versioning
- Created `src/store/settingsStore.ts` (Zustand) for settings management
- Completely rewrote `src/components/modules/settings/Settings.tsx`:
  - Language dropdown (7 languages)
  - Persona selection cards with style metrics
  - Speech enabled toggle
  - Rate and pitch sliders
  - TTS preview button with live sample text
- Integrated persona settings into `src/lib/services/tts.ts`:
  - Checks `speechEnabled` setting
  - Uses persona TTS config as defaults
  - Custom rate/pitch override persona defaults
  - Graceful voice fallback

### Previous Changes

#### Content Sanitization (2026-02-10)

- Modified `src/lib/constants.ts` to support safe/intense content modes
- Created `PHRASES_SAFE` and `PHRASES_INTENSE` with technical vs. explicit language
- Added `CONTENT_MODE` configuration via `localStorage.getItem('_cm')`
- Created `CONTENT_RESTORATION.md` documenting the restoration method

#### Enhanced Scoring System (2026-02-10)

- Updated `src/store/gameStore.ts` with granular ritual-based scoring
- Base: 20 points per completed domain
- Bonuses: Morning ritual (+20), Photo upload (+25), Plug 10h+ (+20), Audio 30min+ (+15), Humiliations 50+ (+10), Evening ritual (+10)
- Added TTS penalty trigger when score drops below 70

#### Shame Overlay Component (2026-02-10)

- Created `src/components/shared/ShameOverlay.tsx`
- Fullscreen red overlay with blinking text "ТЫ НИЧТОЖЕСТВО"
- Shows current score and "ПРИНЯТЬ НАКАЗАНИЕ" button
- Integrated into `src/App.tsx` with conditional rendering

#### Auto-TTS Greeting (2026-02-10)

- Enhanced `src/lib/services/tts.ts` with optional rate and pitch parameters
- Modified `src/components/layout/GlobalOverlays.tsx` authorization button
- Session-based greeting (plays once per session via `sessionStorage`)
- Custom voice parameters: rate 1.3, pitch 0.9

#### Russian Translation (2026-02-09)

- Translated UI elements in `AppShell.tsx`, `PlanningHub.tsx`
- Added authorization overlay in `GlobalOverlays.tsx`
- Modified `gameStore.ts` to manage `interactionRequired` state

## Project Structure

```text
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx (navigation)
│   │   └── GlobalOverlays.tsx (authorization, enforcement)
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── planning/
│   │   ├── journal/
│   │   └── settings/ (Settings.tsx - NEW UI)
│   ├── shared/
│   │   └── ShameOverlay.tsx
│   └── ui/ (Radix UI components)
├── hooks/
│   └── useEnforcement.ts
├── i18n/ (NEW)
│   ├── index.ts
│   └── locales/
│       ├── en/common.json
│       ├── fr/common.json
│       ├── ru/common.json
│       ├── de/common.json
│       ├── he/common.json
│       ├── sw/common.json
│       └── ur/common.json
├── lib/
│   ├── constants.ts (content sanitization)
│   ├── migration.ts
│   ├── personas.ts (NEW)
│   ├── storage.ts (NEW)
│   ├── services/
│   │   └── tts.ts (persona integration)
│   └── repositories/
│       └── DayRepository.ts
├── store/
│   ├── gameStore.ts (scoring system)
│   └── settingsStore.ts (NEW)
└── types/
    └── index.ts (persona types)
```

## Key Features

- **Offline-first PWA** with IndexedDB (Dexie)
- **Audio monitoring** and speech recognition
- **TTS feedback** with persona-based voice configuration
- **Scoring system** with ritual bonuses and penalties
- **Content sanitization** (safe/intense modes)
- **Internationalization** (7 languages with RTL support)
- **User personas** (supportive/neutral/strict)
- **CI/CD pipeline** with GitHub Actions

## Tech Stack

- React 19 + TypeScript
- Vite build tool
- Zustand (state management)
- Dexie (IndexedDB wrapper)
- Radix UI + Tailwind CSS
- i18next (internationalization)
- Web Speech API (TTS + recognition)

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run i18n:check   # Validate i18n keys
```

## Deployment

- Surge: `c2-la-marque.surge.sh`
- Safe mode enabled by default
- Restore intense mode: `localStorage.setItem('_cm', 'i'); location.reload();`
