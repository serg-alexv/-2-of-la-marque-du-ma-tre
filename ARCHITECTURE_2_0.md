# Architecture 2.0: Resilience & Planning Modules

## 1. Proposed Folder Structure & Interfaces

Refactoring from Monolith `App.tsx` to Feature-Based Architecture.

```text
/src
  /assets             # Static assets (sounds, images)
  /components
    /ui               # Atomic UI (shadcn/radix: Button, Card, Progress, Dialog)
    /layout           # Shell, Navbar, FullscreenFocus
    /modules          # Domain-specific Feature Components
      /planning       # DailyFlow, WeeklyReview, MonthlySeason
      /dashboard      # Rings, QuickActions, Status
      /audio          # BreathingMonitor, VoiceFeedback
      /escalation     # GovernanceOverlay, PunishmentModal
  /hooks              # Custom React Hooks (useAudio, useSpeech, useEscalation)
  /lib                # Utilities (cn, formatters)
  /services
    audio.ts          # Existing AudioContext Logic
    speech.ts         # Existing Speech Recognition
    tts.ts            # Text-to-Speech Manager (Voices, Queue)
  /store              # Zustand Stores
    gameStore.ts      # Score, XP, Escalation Level
    planStore.ts      # Daily/Weekly/Monthly Data
    uiStore.ts        # Modal states, Focus Mode
  /db                 # IndexedDB Layer
    db.ts             # Schema & Connection
    repositories.ts   # Typed CRUD operations
  types.ts            # Shared TS Interfaces
  App.tsx             # Routing & Global Providers only
  main.tsx            # Entry point
```

### Key Interfaces (`types.ts`)

```typescript
// --- DOMAINS & PLANNING ---
export type LifeDomain = 'body' | 'meaning' | 'creation' | 'connection' | 'intimacy';

export interface DailyTask {
  id: string;
  domain: LifeDomain;
  title: string;
  completed: boolean;
  duration?: number; // minutes
  notes?: string;
}

export interface DayPlan {
  date: string; // ISO YYYY-MM-DD
  scarcityScore: number; // 0-100 (The "Score")
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  morningIgnition: {
    mood: number;
    intention: string;
    completedAt?: number;
  };
  middaySprint: {
    focusTime: number; // minutes tracked
    completed: boolean;
  };
  eveningHarvest: {
    wins: string[];
    lessons: string[];
    completedAt?: number;
  };
  domains: Record<LifeDomain, {
    completed: boolean;
    value: number; // e.g., minutes or boolean (0/1)
  }>;
}

// --- REVIEW CYCLES ---
export interface WeeklyReview {
  id: string; // YYYY-Wxx
  startDate: string;
  roles: {
    ceo: string;   // Strategy
    coach: string; // Correction/Tactics
    lover: string; // Self-care/Reward
  };
  ruleOfTheWeek: string;
  socialRitual: string;
  violations: string[]; // List of rule breaks
}

export interface MonthlySeason {
  id: string; // YYYY-MM
  theme: string;
  identityShift: string; // "I am becoming X"
  b-roll: string; // Path/Blob ID for "Contribution Capsule"
}
```

## 2. Minimal Data Model & Storage (IndexedDB)

**Storage Strategy:**

* **Library:** `idb` (Promised-based wrapper for IndexedDB).
* **Database:** `ResilienceDB_v1`
* **Stores (Tables):**
    1. `daily_logs`: KeyPath: `date`
    2. `weekly_reviews`: KeyPath: `id`
    3. `monthly_seasons`: KeyPath: `id`
    4. `settings`: KeyPath: `key` (Global config)

**Schema Versioning:**

```typescript
import { openDB } from 'idb';

const dbPromise = openDB('ResilienceDB', 1, {
  upgrade(db) {
    db.createObjectStore('daily_logs', { keyPath: 'date' });
    db.createObjectStore('weekly_reviews', { keyPath: 'id' });
    db.createObjectStore('monthly_seasons', { keyPath: 'id' });
    db.createObjectStore('settings', { keyPath: 'key' });
  },
});
```

## 3. UI Screen List & Components

1. **Dashboard (Today)**
    * *Header*: Score Ring (0-100), Escalation Badge (Lvl 1-4).
    * *Hero*: Current Phase (Ignition / Sprint / Harvest) -> Action Button.
    * *Body*: "5 Domains" Progress Rings (5 small circles).
    * *Footer*: Quick Audio Control (Mic Status).
2. **Planning Hub (Tab Navigation)**
    * *Weekly*: 3-Column Layout (CEO/Coach/Lover). Rule visualizer.
    * *Monthly*: Season Theme Card + "Capsule" Recorder.
3. **Journal / Log**
    * List view of past days (Infinite scroll).
    * Detail view (Read-only DayPlan).
4. **Escalation Overlay (Modal/Fullscreen)**
    * *Triggered by*: Score < 20 or Rules Violation.
    * *UI*: Red/Black aesthetic. "Protocol Required" checklist.
    * *Action*: "Bad Day Protocol" (10m Body -> 10m Order -> 10m Connection).
5. **Social (Output)**
    * "Generate Status": Text area with copy-to-clipboard.
    * Templates: "Team Update", "Personal Accountability", "Public Signal".

## 4. Key Logic & Algorithms

### A. Escalation Engine (Zustand Store)

```typescript
// store/gameStore.ts
interface GameState {
  score: number;
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  calculateEscalation: (stats: DayPlan) => void;
}

const useGameStore = create<GameState>((set, get) => ({
  score: 100,
  escalationLevel: 0,
  calculateEscalation: (day: DayPlan) => {
    let level = 0;
    const { score } = get();
    
    // Level 1: Nudge (Score < 70)
    if (score < 70) level = 1;
    
    // Level 2: Micro-Reset (Missed Morning Ignition or Score < 50)
    if (score < 50 || !day.morningIgnition.completedAt) level = 2;

    // Level 3: Bad Day Protocol (Score < 30)
    if (score < 30) level = 3;

    // Level 4: Lockdown (Score < 10 or 3 Rule Violations)
    if (score < 10) level = 4;

    set({ escalationLevel: level as any });
    
    // Trigger TTS
    if (level > 0) speak(`Escalation Level ${level} Active. Compliance Required.`);
  }
}));
```

### B. Bad Day Protocol (Logic)

```typescript
function checkProtocolRequirement(score: number, recentFailures: number): boolean {
  // Auto-trigger if score drops rapidly or critical failure
  const isCritical = score < 20;
  const isSpiral = recentFailures > 2; // 2 days in a row < 50
  
  if (isCritical || isSpiral) {
    return true; // Activates "Bad Day Protocol" UI locking
  }
  return false;
}

// The protocol reduces expectations for 24h
function applyBadDayModifiers(baseTarget: number): number {
  return Math.floor(baseTarget * 0.5); // 50% effort required during recovery
}
```

### C. Migration (LocalStorage -> IndexedDB)

```typescript
async function migrateLegacyData() {
  const raw = localStorage.getItem('kleymo_state_v2');
  if (!raw) return;

  const legacy = JSON.parse(raw);
  const db = await dbPromise;

  // Transform legacy "history" array to new "daily_logs"
  const tx = db.transaction('daily_logs', 'readwrite');
  for (const day of legacy.history) {
    await tx.store.put({
      date: day.date,
      scarcityScore: day.score,
      escalationLevel: 0, // Default for past
      morningIgnition: { mood: 5, intention: "Legacy Import", completedAt: 1 },
      middaySprint: { focusTime: day.plugTimeSeconds ? day.plugTimeSeconds / 60 : 0, completed: true },
      eveningHarvest: { wins: [], lessons: [], completedAt: 1 },
      domains: {
        body: { completed: true, value: 1 },
        meaning: { completed: true, value: 1 },
        creation: { completed: true, value: 1 },
        connection: { completed: true, value: 1 },
        intimacy: { completed: day.eveningOrgasm, value: 1 }
      }
    });
  }
  await tx.done;
  localStorage.setItem('migration_v2_completed', 'true');
}
```

### D. Social Generation Logic

```typescript
function generateSocialUpdate(channel: 'home' | 'team' | 'public', day: DayPlan): string {
  const score = day.scarcityScore;
  const emoji = score > 90 ? '🟢' : score > 70 ? '🟡' : '🔴';

  switch (channel) {
    case 'home':
      return `Partner Update [${emoji}]: Score ${score}. Intimacy protocol: ${day.domains.intimacy.completed ? 'Active' : 'Pending'}. Need 10m connection time?`;
    case 'team':
      return `Status: ${score}% Capacity. Sprint: ${day.middaySprint.completed ? 'Done' : 'Missed'}. Blocker: ${day.escalationLevel > 0 ? 'Escalation Tier ' + day.escalationLevel : 'None'}.`;
    case 'public':
      return `Resilience Log Day ${day.date}: ${score}/100. ${day.eveningHarvest.wins.length} Wins logged. #Discipline`;
  }
}
```

## 5. Technology Stack Upgrades

1. **Build Tool**: Continue using **Vite**.
2. **UI Framework**: Add **TailwindCSS** + **clsx** + **tailwind-merge**.
3. **Components**: Add **Radix UI** primitives (Dialog, Progress, Slider).
4. **Icons**: **Lucide React**.
5. **State**: **Zustand** (Minimal boilerplate).
6. **DB**: **idb** (Tiny indexedDB wrapper).
