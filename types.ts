export interface LoyaltyCheck {
    active: boolean;
    deadline: number; // Timestamp
    completed: boolean;
    photoId: string | null;
  }
  
  export interface DayData {
    date: string; // ISO Date String YYYY-MM-DD
    submitted: boolean;
    score: number;
    feedback: string;
    
    // Config for the day (penalties from previous day)
    multiplier: number; // Default 1, can be 1.5 or 2 based on history
    
    // Tasks
    morningRitual: boolean;
    morningPhotoId: string | null;
    
    plugTimeSeconds: number;
    plugTargetMet: boolean;
    
    audioTimeSeconds: number;
    audioTargetMet: boolean;
    
    humiliationCount: number;
    
    eveningRitualCount: number;
    eveningOrgasm: boolean;
    eveningPhotoId: string | null;
    
    missedLoyaltyChecks: number;
  }
  
  export interface HistoryItem {
    date: string;
    score: number;
    feedback: string;
    punishment?: string;
    photoIds?: string[]; // Array of associated photo IDs for export
  }
  
  export interface AppState {
    currentDay: DayData;
    history: HistoryItem[];
    streak: number;
    lastPunishment: string | null;
    orgasmLockUntil: number; // Timestamp
    loyaltyCheck: LoyaltyCheck;
    lastLoyaltyTrigger: number; // Timestamp
    isSundayJudgmentSeen: boolean;
    
    // New enforcement state
    penaltyPoints: number; // Accumulated penalty points for evasion
    lastActiveTime: number; // For detecting long closures
    emergencyMode: boolean; // If streak lost > 3 days
  }
  
  export const PUNISHMENTS = [
    "Зеркальный допрос: 20 минут смотри в глаза своему отражению и перечисляй свои недостатки.",
    "Ползание: Передвигаться по квартире только на коленях в течение 2 часов.",
    "Ледяной душ: 5 минут ледяной воды с криками благодарности.",
    "Угол: Стоять в углу на коленях 45 минут без движения.",
    "Письмо: Написать 500 раз фразу 'Я ничтожная собственность Господина' от руки.",
    "Молчание: Полный запрет на речь в течение 12 часов (кроме отчетов Господину).",
    "Изоляция: 1 час в полной темноте без одежды и звуков."
  ];