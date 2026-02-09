
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { audioMonitor } from '@/lib/services/audio';
import { speechService } from '@/lib/services/speech';
import { speak } from '@/lib/services/tts';

export const useEnforcement = () => {
    const { currentDay, escalationLevel, score, updateDay, triggerOverlay, clearOverlay } = useGameStore();
    const breathTimeoutRef = useRef<number | null>(null);
    const [isHoldingBreath, setIsHoldingBreath] = useState(false);

    useEffect(() => {
        if (!currentDay) return;

        // 1. SPEECH RECOGNITION
        const unsubSpeech = speechService.subscribe((text) => {
            const lower = text.toLowerCase();
            // Acknowledge submission or loyalty check words
            if (lower.includes('прости') || lower.includes('да') || lower.includes('хозяин')) {
                // Potential XP award or penalty reduction
                console.log("[ENFORCEMENT] Recognized submissive speech");
            }
        });

        // 2. BREATHING DETECTION (Silence Punishment)
        const unsubAudio = audioMonitor.subscribe((metrics) => {
            if (!metrics.isBreathing) {
                if (!isHoldingBreath) {
                    setIsHoldingBreath(true);
                    if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);

                    // 15s warning
                    breathTimeoutRef.current = window.setTimeout(() => {
                        triggerOverlay('voice'); // We need a 'voice' type in uiStore/gameStore
                        speak("ДЫШИ! ТЫ ЗАБЫЛА КАК ДЫШАТЬ?", true);

                        // 10s penalty
                        breathTimeoutRef.current = window.setTimeout(() => {
                            speak("НАКАЗАНИЕ ЗА ЗАДЕРЖКУ ДЫХАНИЯ.", true);
                            // Penalty logic: -5 score
                            const newScore = Math.max(0, score - 5);
                            updateDay({ scarcityScore: newScore });
                        }, 10000);
                    }, 15000);
                }
            } else {
                if (isHoldingBreath) {
                    setIsHoldingBreath(false);
                    if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);
                    clearOverlay();
                }
            }
        });

        // 3. VISIBILITY ENFORCEMENT
        const handleVisibility = () => {
            if (document.hidden) {
                // Warning overlay or penalty
                triggerOverlay('pacer'); // Temporary map to pacer for visual warning
            }
        };

        // 4. PERIODIC LOYALTY CHECKS
        const loyaltyInterval = setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every 10 mins
                triggerOverlay('locked');
                speak("ПРОВЕРКА ЛОЯЛЬНОСТИ. ПОДТВЕРДИ СВОЕ ПОВИНОВЕНИЕ.", true);
            }
        }, 600000); // Check every 10 mins

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            unsubSpeech();
            unsubAudio();
            clearInterval(loyaltyInterval);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);
        };
    }, [currentDay, isHoldingBreath, score]);

    // Initialize Services
    useEffect(() => {
        audioMonitor.startListening();
        speechService.start();
        return () => {
            audioMonitor.stopListening();
            speechService.stop();
        };
    }, []);
};
