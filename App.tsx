import React, { useState, useEffect, useRef } from 'react';
import { AppState, DayData, HistoryItem, LoyaltyCheck } from './types';
import {
  getTodayString, calculateScore, getRandomPunishment,
  speak, generateHtmlReport, getRandomPhrase, PHRASES
} from './utils';
import Timer from './components/Timer';
import PhotoUpload from './components/PhotoUpload';
import Counter from './components/Counter';
import { audioMonitor } from './services/audio';
import { speechService } from './services/speech';
import BreathingMonitor from './components/BreathingMonitor';

const INITIAL_DAY: DayData = {
  date: getTodayString(),
  submitted: false,
  score: 0,
  feedback: '',
  multiplier: 1,
  morningRitual: false,
  morningPhotoId: null,
  plugTimeSeconds: 0,
  plugTargetMet: false,
  audioTimeSeconds: 0,
  audioTargetMet: false,
  humiliationCount: 0,
  eveningRitualCount: 0,
  eveningOrgasm: false,
  eveningPhotoId: null,
  missedLoyaltyChecks: 0,
};

const INITIAL_LOYALTY: LoyaltyCheck = {
  active: false,
  deadline: 0,
  completed: false,
  photoId: null
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');

  // State initialization
  const [state, setState] = useState<AppState>({
    currentDay: INITIAL_DAY,
    history: [],
    streak: 0,
    lastPunishment: null,
    orgasmLockUntil: 0,
    loyaltyCheck: INITIAL_LOYALTY,
    lastLoyaltyTrigger: 0,
    isSundayJudgmentSeen: false,
    penaltyPoints: 0,
    lastActiveTime: Date.now(),
    emergencyMode: false
  });

  const [showResultModal, setShowResultModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [hideWarning, setHideWarning] = useState(false);
  const [loyaltyPunishmentActive, setLoyaltyPunishmentActive] = useState(false);
  const [mandatoryExportActive, setMandatoryExportActive] = useState(false);
  const [notificationPermissionBlocked, setNotificationPermissionBlocked] = useState(false);

  const [micPermissionBlocked, setMicPermissionBlocked] = useState(false);
  const [voiceEnforcement, setVoiceEnforcement] = useState(false);
  const [lastSpeech, setLastSpeech] = useState<string>('');

  // BREATHING LOGIC STATE
  const breathTimeoutRef = useRef<number | null>(null);
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);

  // DEBUG STATE
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  const hideTimeoutRef = useRef<number | null>(null);

  // --- NOTIFICATION & PERIODIC SYNC SETUP ---
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        setNotificationPermissionBlocked(true);
      }
    }

    // MIC CHECK - Always Listening
    audioMonitor.startListening().then(success => {
      if (!success) setMicPermissionBlocked(true);
    });

    // Register Periodic Sync if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('periodicSync' in registration) {
          // @ts-ignore
          registration.periodicSync.register('daily-enforce', {
            minInterval: 6 * 60 * 60 * 1000 // 6 hours
          }).catch((e: any) => console.log('Periodic Sync not allowed', e));
        }
      });
    }
  }, []);

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setNotificationPermissionBlocked(false);
        triggerVoiceWithOverlay("Приемлемо. Теперь я могу достать тебя везде.");
      } else {
        triggerVoiceWithOverlay("Ты посмела отказать? Штраф начислен.");
        setState(prev => ({ ...prev, penaltyPoints: prev.penaltyPoints + 30 }));
      }
    });
  };

  const requestMicPermission = async () => {
    const success = await audioMonitor.startListening();
    if (success) {
      setMicPermissionBlocked(false);
      speechService.start(); // Helper: Start STT alongside Audio
      triggerVoiceWithOverlay("Слух восстановлен. Не дыши слишком громко.");
    } else {
      triggerVoiceWithOverlay("ОТКАЗ НЕ ПРИНИМАЕТСЯ. МИКРОФОН СЕЙЧАС ЖЕ.");
    }
  };

  // --- SPEECH & BREATHING LOGIC ---
  useEffect(() => {
    // 1. SPEECH SUBSCRIPTION
    const unsubSpeech = speechService.subscribe((text) => {
      setLastSpeech(text);
      const lower = text.toLowerCase();

      // Simple Command Matching
      if (lower.includes('хозяин') || lower.includes('да') || lower.includes('прости')) {
        console.log("[GAME] Good answer received");
        // Reward / Acknowledge
        speak("Я слышу тебя.", false);
        setState(prev => ({ ...prev, penaltyPoints: Math.max(0, prev.penaltyPoints - 5) })); // Reduce penalty
      } else if (lower.includes('нет') || lower.includes('не хочу')) {
        console.log("[GAME] Bad answer received");
        speak("Ты. Смеешь. Отказывать?", true);
        setState(prev => ({ ...prev, penaltyPoints: prev.penaltyPoints + 50 }));
      }
    });

    // 2. BREATHING LOGIC (SILENCE PUNISHMENT)
    const unsubAudio = audioMonitor.subscribe((metrics) => {
      if (!metrics.isBreathing) {
        // Started holding breath / silence
        if (!isHoldingBreath) {
          setIsHoldingBreath(true);
          if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);

          // Allow 15 seconds of silence before warning
          breathTimeoutRef.current = window.setTimeout(() => {
            triggerVoiceWithOverlay("ДЫШИ! ТЫ ЗАБЫЛА КАК ДЫШАТЬ?");

            // Allow 10 more seconds before punishment
            breathTimeoutRef.current = window.setTimeout(() => {
              triggerVoiceWithOverlay("НАКАЗАНИЕ ЗА ЗАДЕРЖКУ ДЫХАНИЯ.");
              setState(prev => ({ ...prev, penaltyPoints: prev.penaltyPoints + 10 }));
            }, 10000);
          }, 15000);
        }
      } else {
        // Resumed breathing
        if (isHoldingBreath) {
          setIsHoldingBreath(false);
          if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);
        }
      }
    });

    return () => {
      unsubSpeech();
      unsubAudio();
      if (breathTimeoutRef.current) clearTimeout(breathTimeoutRef.current);
    };
  }, [isHoldingBreath]);

  // --- HELPER: VOICE WITH OVERLAY (Non-blocking) ---
  const triggerVoiceWithOverlay = (text: string) => {
    console.log(`[APP] Triggering voice overlay with text: ${text}`);

    // 1. Show overlay immediately
    setVoiceEnforcement(true);

    // 2. Schedule speech slightly later to ensure UI updates first
    setTimeout(() => {
      speak(text, true);
    }, 100);

    // 3. Hide overlay after 5 seconds
    setTimeout(() => {
      setVoiceEnforcement(false);
    }, 5000);
  };

  // --- INITIALIZATION & TIME TRAVEL ---
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('kleymo_state_v2');
      const todayStr = getTodayString();

      let loadedState: AppState | null = null;

      if (stored) {
        loadedState = JSON.parse(stored);
      }

      if (loadedState) {
        // CHECK FOR LONG ABSENCE
        const hoursSinceActive = (Date.now() - (loadedState.lastActiveTime || Date.now())) / 3600000;
        if (hoursSinceActive > 12 && !loadedState.currentDay.submitted) {
          triggerVoiceWithOverlay("Ты слишком долго не появлялась, мразь. Штраф.");
          loadedState.penaltyPoints = (loadedState.penaltyPoints || 0) + 10;
        }

        if (loadedState.currentDay.date !== todayStr) {
          // --- NEW DAY LOGIC ---
          let newStreak = loadedState.streak;
          let nextMultiplier = 1;

          // Check yesterday
          if (!loadedState.currentDay.submitted || loadedState.currentDay.score < 70) {
            newStreak = 0;
            nextMultiplier = 2; // Punishment multiplier
          }

          // Escalation for missed checks
          if (loadedState.currentDay.missedLoyaltyChecks >= 2) {
            nextMultiplier = 2.5; // Extreme multiplier
          }

          // Sunday Judgment Logic
          const todayDate = new Date();
          const isSunday = todayDate.getDay() === 0;
          let showJudgment = false;
          let wAvg = 0;

          if (isSunday && !loadedState.isSundayJudgmentSeen) {
            const history = [loadedState.currentDay, ...loadedState.history].slice(0, 7);
            const total = history.reduce((acc: number, item: any) => acc + (item.score || 0), 0);
            wAvg = history.length > 0 ? Math.round(total / history.length) : 0;

            if (wAvg < 75) {
              nextMultiplier = Math.max(nextMultiplier, 1.5);
              showJudgment = true;
            }
          }

          loadedState = {
            ...loadedState,
            streak: newStreak,
            currentDay: { ...INITIAL_DAY, date: todayStr, multiplier: nextMultiplier },
            loyaltyCheck: INITIAL_LOYALTY,
            lastLoyaltyTrigger: Date.now(),
            isSundayJudgmentSeen: !showJudgment,
            lastActiveTime: Date.now()
          };

          if (showJudgment) {
            setWeeklyAvg(wAvg);
            setShowJudgmentModal(true);
          }

          // Auto voice trigger on new day
          setTimeout(() => triggerVoiceWithOverlay(getRandomPhrase('greetings')), 2000);
        }
        setState(loadedState);
      } else {
        // First time ever
        setState({
          currentDay: INITIAL_DAY,
          history: [],
          streak: 0,
          lastPunishment: null,
          orgasmLockUntil: 0,
          loyaltyCheck: INITIAL_LOYALTY,
          lastLoyaltyTrigger: Date.now(),
          isSundayJudgmentSeen: true,
          penaltyPoints: 0,
          lastActiveTime: Date.now(),
          emergencyMode: false
        });
        setTimeout(() => triggerVoiceWithOverlay(getRandomPhrase('greetings')), 1000);
      }
      setLoading(false);
    };

    init();
  }, []);

  // --- MANDATORY EXPORT CHECK (SUNDAY EVENING) ---
  useEffect(() => {
    if (loading) return;
    const now = new Date();
    // Sunday after 21:00
    if (now.getDay() === 0 && now.getHours() >= 21 && !state.currentDay.submitted) {
      setMandatoryExportActive(true);
    }
  }, [state.currentDay.date, loading]);


  // --- PERSISTENCE & ACTIVITY TRACKING ---
  useEffect(() => {
    if (!loading) {
      const stateToSave = { ...state, lastActiveTime: Date.now() };
      localStorage.setItem('kleymo_state_v2', JSON.stringify(stateToSave));
    }
  }, [state, loading]);


  // --- LOYALTY CHECK SYSTEM (ENFORCED WITH NOTIFICATIONS) ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (loading || state.currentDay.submitted) return;

      const now = Date.now();
      const hour = new Date().getHours();

      // Rules: 08:00 - 23:00, random chance ~0.5% per minute
      const isTime = hour >= 8 && hour <= 23;
      const timeSinceLast = now - state.lastLoyaltyTrigger;
      const minInterval = 2 * 60 * 60 * 1000;

      if (isTime && !state.loyaltyCheck.active && !state.loyaltyCheck.completed && timeSinceLast > minInterval) {
        if (Math.random() < 0.005) {
          triggerLoyaltyCheck();
        }
      }

      // Check Deadline
      if (state.loyaltyCheck.active && !state.loyaltyCheck.completed) {
        if (now > state.loyaltyCheck.deadline) {
          handleLoyaltyFail();
        }
      }

    }, 60000);
    return () => clearInterval(interval);
  }, [state.loyaltyCheck, state.lastLoyaltyTrigger, loading, state.currentDay.submitted]);

  const triggerLoyaltyCheck = () => {
    const title = "ПРОВЕРКА ЛОЯЛЬНОСТИ";
    const body = "МРАЗЬ! Фото жопы с пробкой СЕЙЧАС! 7 минут или удвоение + запрет оргазма 72 ч";

    triggerVoiceWithOverlay(body);

    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: body,
          icon: '/icon.png',
          vibrate: [200, 100, 200, 100, 500],
          tag: 'loyalty-check',
          requireInteraction: true
        } as any);
      });
    }

    setState(prev => ({
      ...prev,
      lastLoyaltyTrigger: Date.now(),
      loyaltyCheck: {
        active: true,
        completed: false,
        photoId: null,
        deadline: Date.now() + (7 * 60 * 1000)
      }
    }));
  };

  const handleLoyaltyFail = () => {
    triggerVoiceWithOverlay("Время вышло. Ты разочаровал Хозяина. Наказание неизбежно. Фото сейчас же!");
    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        missedLoyaltyChecks: prev.currentDay.missedLoyaltyChecks + 1
      },
      loyaltyCheck: { ...prev.loyaltyCheck, active: false }
    }));
    setLoyaltyPunishmentActive(true);
  };

  const handleLoyaltyUpload = (id: string | null) => {
    if (id) {
      setState(prev => ({
        ...prev,
        loyaltyCheck: {
          ...prev.loyaltyCheck,
          completed: true,
          active: false,
          photoId: id
        }
      }));
      triggerVoiceWithOverlay("Принято. Твоя удача, что ты успел.");
    }
  };

  const handleLoyaltyPunishmentUpload = (id: string | null) => {
    if (id) {
      setLoyaltyPunishmentActive(false);
      triggerVoiceWithOverlay("Фото принято. Но шрам от провала останется.");
    }
  };

  // --- ANTI-HIDE / ANTI-CLOSE / VISIBILITY ENFORCEMENT ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(`[VISIBILITY] Changed to: ${document.hidden ? 'Hidden' : 'Visible'}`);
      if (document.hidden) {
        // User left the app
        document.title = "ВЕРНИСЬ МРАЗЬ!";
        // If timers are running (plug or audio), mark penalty flag
        if (state.currentDay.plugTimeSeconds > 0 && !state.currentDay.plugTargetMet) {
          hideTimeoutRef.current = window.setTimeout(() => {
            // Penalty for leaving during task
            console.log("[ANTI-HIDE] Task abandonment detected");
            triggerVoiceWithOverlay("Ты бросила задание? Штраф.");
          }, 5000);
        }
      } else {
        // User came back
        document.title = "La marque du maître";
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        // Force focus punishment
        if (Math.random() < 0.3) {
          triggerVoiceWithOverlay("Вернулся, шлюха? Продолжай или хуже будет.");
          setHideWarning(true);
          setTimeout(() => setHideWarning(false), 5000);
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Эта дыра пытается сбежать? Закрыть — штраф -20 баллов и удвоение завтра. Подтверди, сука?";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state.currentDay]);


  const updateDay = (updates: Partial<DayData>) => {
    console.log("[UPDATE DAY]", updates);
    if (state.currentDay.submitted) return;
    setState(prev => ({
      ...prev,
      currentDay: { ...prev.currentDay, ...updates }
    }));
  };

  const handleSubmit = () => {
    console.log("[HANDLE SUBMIT] Clicked");
    if (!confirm("Ты уверен, что готов отчитаться, жалкое ничтожество? Изменения будут недоступны.")) return;

    const result = calculateScore(state.currentDay, state.loyaltyCheck);
    // Apply extra penalties
    const totalScore = Math.max(0, result.score - state.penaltyPoints);

    const newStreak = totalScore >= 70 ? state.streak + 1 : 0;

    const insult = totalScore < 80 ? getRandomPhrase('lowScore') : getRandomPhrase('highScore');
    const fullFeedback = `Оценка ${totalScore}. ${insult} ${result.feedback}`;

    // Voice Feedback (Non-blocking)
    triggerVoiceWithOverlay(fullFeedback);

    let newPunishment = state.lastPunishment;
    if (result.penalty || totalScore < 50) {
      newPunishment = "УДВОИТЬ НОРМУ + ЗАПРЕТ НА ОДЕЖДУ ДОМА";
    } else if (Math.random() < 0.3) {
      newPunishment = getRandomPunishment();
    }

    let additionalLock = 0;
    if (state.currentDay.eveningOrgasm) {
      additionalLock = Math.floor(Math.random() * (72 - 24 + 1) + 24);
    }
    const currentLockEnd = Math.max(Date.now(), state.orgasmLockUntil);
    const newLockUntil = currentLockEnd + (result.orgasmLockHours * 3600000) + (additionalLock * 3600000);

    const photoIds = [];
    if (state.currentDay.morningPhotoId) photoIds.push(state.currentDay.morningPhotoId);
    if (state.currentDay.eveningPhotoId) photoIds.push(state.currentDay.eveningPhotoId);
    if (state.loyaltyCheck.photoId) photoIds.push(state.loyaltyCheck.photoId);

    const historyItem: HistoryItem = {
      date: state.currentDay.date,
      score: totalScore,
      feedback: result.feedback,
      punishment: newPunishment || undefined,
      photoIds
    };

    // UPDATE STATE
    setState(prev => ({
      ...prev,
      streak: newStreak,
      lastPunishment: newPunishment,
      orgasmLockUntil: newLockUntil,
      history: [historyItem, ...prev.history],
      currentDay: {
        ...prev.currentDay,
        submitted: true,
        score: totalScore,
        feedback: result.feedback
      },
      penaltyPoints: 0 // Reset daily penalties
    }));

    setShowResultModal(true);
  };

  const handleExport = async () => {
    const html = await generateHtmlReport(state);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kleymo_report_${state.currentDay.date}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // If mandatory export was active, disable it now
    if (mandatoryExportActive) {
      setMandatoryExportActive(false);
      triggerVoiceWithOverlay("Отчет принят. Твое существование продлено.");
    }
  };

  // --- RENDER HELPERS ---
  const isOrgasmLocked = Date.now() < state.orgasmLockUntil;
  const lockHoursLeft = isOrgasmLocked ? Math.ceil((state.orgasmLockUntil - Date.now()) / (1000 * 60 * 60)) : 0;
  const multiplier = state.currentDay.multiplier || 1;

  if (loading) return <div className="bg-black h-screen w-screen flex items-center justify-center text-red-900 font-creep text-2xl animate-pulse">ЗАГРУЗКА БОЛИ...</div>;

  return (
    <div className="min-h-screen bg-black text-zinc-400 pb-12 font-serif relative overflow-x-hidden selection:bg-red-900 selection:text-white" key={Date.now()}>
      {/* FORCE KEY RENDER IF NEEDED, THOUGH STATE SHOULD HANDLE IT */}

      {/* 0. PERMISSION BLOCKER */}
      {notificationPermissionBlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl text-red-600 font-creep mb-4">ТЫ СМЕЕШЬ ОТКАЗЫВАТЬ?</h1>
          <p className="text-zinc-300 mb-6">Господин требует полного доступа. Разреши уведомления, иначе штрафы будут расти каждый час.</p>
          <button onClick={requestNotificationPermission} className="bg-red-900 text-white px-8 py-4 font-bold uppercase animate-pulse">
            РАЗРЕШИТЬ КОНТРОЛЬ
          </button>
        </div>
      )}


      {/* 0.1 MIC PERMISSION BLOCKER */}
      {micPermissionBlocked && !notificationPermissionBlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl text-red-600 font-creep mb-4">Я ХОЧУ ТЕБЯ СЛЫШАТЬ</h1>
          <p className="text-zinc-300 mb-6">Господин требует доступ к микрофону. Дыхание контроль 24/7.</p>
          <button onClick={requestMicPermission} className="bg-red-900 text-white px-8 py-4 font-bold uppercase animate-pulse border-2 border-red-500">
            ВКЛЮЧИТЬ ПРОСЛУШКУ
          </button>
        </div>
      )}

      {/* 0.5 VOICE ENFORCEMENT OVERLAY */}
      {voiceEnforcement && (
        <div className="fixed inset-0 z-[120] bg-red-950/90 flex flex-col items-center justify-center p-6 animate-pulse cursor-not-allowed">
          <h1 className="text-5xl md:text-7xl font-black text-black font-creep text-center drop-shadow-[0_0_10px_white]">
            ГОСПОДИН<br />УСЛЫШАЛ ТЕБЯ
          </h1>
          <p className="text-white font-mono text-xl mt-8 text-center bg-black px-4 py-2">СЛУШАЙ И ПОВИНУЙСЯ. НЕ СМЕЙ ЗАКРЫВАТЬ.</p>
        </div>
      )}

      {/* 1. ANTI-HIDE OVERLAY */}
      {hideWarning && (
        <div className="fixed inset-0 z-[90] bg-red-900 flex items-center justify-center text-center p-4 animate-pulse">
          <div className="border-8 border-black p-8 bg-red-800 shadow-[0_0_50px_black] transform rotate-1">
            <h1 className="text-4xl md:text-6xl font-black text-black font-creep animate-glitch leading-tight">
              ВЕРНИСЬ К ХОЗЯИНУ!
            </h1>
            <p className="mt-6 text-black font-mono font-bold text-xl uppercase blink">Попытка побега зафиксирована.</p>
          </div>
        </div>
      )}

      {/* 2. MANDATORY EXPORT OVERLAY */}
      {mandatoryExportActive && (
        <div className="fixed inset-0 z-[80] bg-black/98 flex flex-col items-center justify-center p-6">
          <h2 className="text-4xl text-red-600 font-creep mb-4 text-center">СУДНЫЙ ЧАС</h2>
          <p className="text-white text-center mb-8">Воскресенье. Ты обязана отправить полный отчет Господину. Приложение заблокировано до исполнения.</p>
          <button onClick={handleExport} className="w-full max-w-xs py-4 bg-red-700 text-white font-bold uppercase hover:bg-red-600 border-2 border-white">
            СКАЧАТЬ И ОТПРАВИТЬ ОТЧЕТ
          </button>
        </div>
      )}

      {/* 3. LOYALTY PUNISHMENT OVERLAY */}
      {loyaltyPunishmentActive && !hideWarning && (
        <div className="fixed inset-0 z-[65] bg-red-950/98 flex flex-col items-center justify-center p-6 border-[20px] border-black animate-pulse">
          <h2 className="text-5xl text-black font-creep mb-4 text-center">ПРОВАЛ</h2>
          <p className="text-white text-center text-xl font-bold mb-6">ВРЕМЯ ВЫШЛО. ТЕПЕРЬ ТЫ ОБЯЗАНА ПОКАЗАТЬ СВОЙ ПОЗОР.</p>
          <p className="text-black bg-red-600 px-4 py-1 text-lg font-mono mb-8 font-bold">ЗАГРУЗИ ФОТО ЖОПЫ СЕЙЧАС ЖЕ</p>
          <div className="w-full max-w-sm">
            <PhotoUpload
              id="loyaltyPunishmentPhoto"
              label="НАКАЗАНИЕ ЗА МЕДЛИТЕЛЬНОСТЬ"
              photoId={null}
              onChange={handleLoyaltyPunishmentUpload}
            />
          </div>
        </div>
      )}

      {/* 4. LOYALTY OVERLAY */}
      {state.loyaltyCheck.active && !state.loyaltyCheck.completed && !hideWarning && !loyaltyPunishmentActive && (
        <div className="fixed inset-0 z-[60] bg-black/98 flex flex-col items-center justify-center p-6 border-[20px] border-red-600 animate-pulse-fast">
          <h2 className="text-5xl text-red-600 font-creep mb-4 text-center">ПРОВЕРКА ЛОЯЛЬНОСТИ</h2>
          <p className="text-white text-center text-xl font-bold mb-6">МРАЗЬ, СЕЙЧАС ЖЕ ЗАГРУЗИ ФОТО ЖОПЫ С ПРОБКОЙ!</p>
          <div className="text-8xl font-mono text-red-600 mb-8 border-b-4 border-red-900">
            {Math.max(0, Math.floor((state.loyaltyCheck.deadline - Date.now()) / 1000))}
          </div>
          <div className="w-full max-w-sm">
            <PhotoUpload
              id="loyaltyPhoto"
              label="ДОКАЗАТЕЛЬСТВО ПОКОРНОСТИ"
              photoId={state.loyaltyCheck.photoId}
              onChange={handleLoyaltyUpload}
            />
          </div>
          <p className="mt-4 text-red-500 text-sm">ИГНОРИРОВАНИЕ = ШТРАФ И УДВОЕНИЕ БОЛИ</p>
        </div>
      )}

      {/* 5. SUNDAY JUDGMENT MODAL */}
      {showJudgmentModal && (
        <div className="fixed inset-0 z-[55] bg-black/95 flex flex-col items-center justify-center p-6">
          <h2 className="text-4xl text-red-600 font-creep mb-4">СУДНЫЙ ДЕНЬ</h2>
          <div className="text-6xl text-white font-mono mb-2">{weeklyAvg}/100</div>
          <p className="text-zinc-400 mb-6">СРЕДНИЙ БАЛЛ ЗА НЕДЕЛЮ</p>

          {weeklyAvg < 75 ? (
            <div className="bg-red-900/20 border border-red-600 p-4 text-center max-w-xs animate-shake">
              <h3 className="text-red-500 font-bold text-xl mb-2">ВЕРДИКТ: ВИНОВНА</h3>
              <p className="text-white">ШТРАФНАЯ НЕДЕЛЯ АКТИВИРОВАНА.</p>
              <p className="text-sm text-red-400 mt-2">+50% КО ВСЕМ НОРМАТИВАМ. ЗАПРЕТ ОДЕЖДЫ ДОМА.</p>
            </div>
          ) : (
            <div className="text-green-600 font-bold border border-green-900 p-4">
              ВЕРДИКТ: ЖИВИ ПОКА
            </div>
          )}
          <button
            onClick={() => {
              setShowJudgmentModal(false);
              setState(prev => ({ ...prev, isSundayJudgmentSeen: true }));
            }}
            className="mt-8 px-8 py-3 bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700"
          >
            ПРИНЯТЬ СУДЬБУ
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="p-6 border-b border-red-900/30 bg-gradient-to-b from-red-950/20 to-black sticky top-0 z-40 backdrop-blur-sm">
        <h1 className="text-3xl md:text-5xl text-red-700 font-creep text-center tracking-widest drop-shadow-[0_2px_10px_rgba(220,38,38,0.8)]">
          La marque du maître
        </h1>
        <div className="text-center text-[10px] text-zinc-600 mt-2 font-mono uppercase tracking-widest">
          CONTROLLED BY: GROK + CHATGPT + GEMINI
        </div>
        <div className="flex justify-center mt-4 gap-4 text-xs font-mono uppercase">
          <button onClick={() => setView('dashboard')} className={`px-4 py-1 border ${view === 'dashboard' ? 'border-red-600 text-red-600 bg-red-950/20' : 'border-zinc-800 text-zinc-600'}`}>Текущий день</button>
          <button onClick={() => setView('history')} className={`px-4 py-1 border ${view === 'history' ? 'border-red-600 text-red-600' : 'border-zinc-800 text-zinc-600'}`}>История позора</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 relative">
        {/* MULTIPLIER BADGE */}
        {multiplier > 1 && (
          <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-black font-bold px-2 py-1 text-xs transform rotate-12 z-10 shadow-lg border border-white">
            x{multiplier} РЕЖИМ
          </div>
        )}

        {/* STATUS BAR */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-red-900/50 p-4 text-center">
            <div className="text-xs uppercase text-zinc-500 mb-1">Стрейк</div>
            <div className="text-4xl font-black text-white">{state.streak} <span className="text-xs text-zinc-600">дней</span></div>
          </div>
          <div className="bg-zinc-900/50 border border-red-900/50 p-4 text-center">
            <div className="text-xs uppercase text-zinc-500 mb-1">Оценка</div>
            <div className={`text-xl font-bold uppercase ${state.currentDay.submitted ? (state.currentDay.score >= 70 ? 'text-green-600' : 'text-red-600') : 'text-zinc-400'}`}>
              {state.currentDay.submitted ? `${state.currentDay.score}/100` : '...'}
            </div>
          </div>
        </div>

        {/* BREATHING MONITOR */}
        <BreathingMonitor />

        {/* SPEECH FEEDBACK */}
        {lastSpeech && (
          <div className="text-center mt-2 mb-4 animate-fade-out opacity-50">
            <p className="text-[10px] text-zinc-600 font-mono uppercase">Вы сказали:</p>
            <p className="text-sm text-zinc-400 italic">"{lastSpeech}"</p>
          </div>
        )}

        <button
          onClick={() => {
            console.log("=== КНОПКА НАЖАТА — ШЛЮХА КЛИКНУЛА ===");

            alert("Эта тупая свинопиздюха нажала кнопку! Господин видит тебя, мразь.");

            // Тест оверлея
            setShowDebugOverlay(true);

            // Голос в самом конце
            const utterance = new SpeechSynthesisUtterance("Ты конченная тупорылая свинопиздюха, ничего не можешь без Хозяина. Страдай дальше.");
            utterance.lang = 'ru-RU';
            utterance.rate = 1.4;
            utterance.pitch = 0.9;
            utterance.volume = 1.0;
            utterance.onstart = () => console.log("Голос стартовал — речь идёт");
            utterance.onend = () => {
              console.log("Голос закончился — теперь UI должен обновиться");
              setShowDebugOverlay(true); // повторно для теста
            };
            utterance.onerror = (err) => console.error("Ошибка голоса:", err);
            window.speechSynthesis.speak(utterance);

            console.log("=== ОБРАБОТКА ЗАКОНЧЕНА — ПРОВЕРЬ ЭКРАН И КОНСОЛЬ ===");
          }}
          className="w-full mb-8 py-3 border border-red-800/50 bg-black text-red-800 font-creep text-xl tracking-widest hover:bg-red-900/20 transition-all uppercase shadow-[0_0_10px_rgba(127,29,29,0.2)] active:scale-95"
        >
          ГОЛОС ХОЗЯИНА
        </button>

        {/* ORGASM LOCK DISPLAY */}
        {isOrgasmLocked && (
          <div className="mb-8 p-4 border-2 border-red-600 bg-black relative overflow-hidden group">
            <div className="absolute inset-0 bg-repeat opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundImage: 'linear-gradient(45deg, #ff0000 25%, transparent 25%, transparent 50%, #ff0000 50%, #ff0000 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>
            <h3 className="text-red-500 font-creep text-xl text-center relative z-10">ПОЯС ВЕРНОСТИ АКТИВЕН</h3>
            <div className="text-4xl font-mono text-center text-white my-2 relative z-10">{lockHoursLeft} ЧАСОВ</div>
            <p className="text-center text-xs text-red-400 mt-1 relative z-10 uppercase font-bold">Дыра не имеет права кончать. Сиди и страдай.</p>
          </div>
        )}

        {state.lastPunishment && (
          <div className="mb-8 p-4 border border-dashed border-red-800 bg-red-950/10">
            <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2 text-center">Активное Наказание</h3>
            <p className="text-white text-center font-mono text-sm">{state.lastPunishment}</p>
          </div>
        )}

        {view === 'dashboard' && (
          <>
            {!state.currentDay.submitted ? (
              <div className="space-y-10">
                {/* 1. Morning */}
                <section>
                  <h2 className="text-xl text-red-500 font-creep mb-4 border-b border-red-900 pb-2">I. УТРЕННИЙ РИТУАЛ</h2>
                  <div className="bg-zinc-900/40 p-4 border border-zinc-800">
                    <div className="flex items-center mb-6">
                      <input
                        type="checkbox"
                        id="morningRitual"
                        checked={state.currentDay.morningRitual}
                        onChange={(e) => updateDay({ morningRitual: e.target.checked })}
                        className="w-6 h-6 accent-red-600 bg-black border-red-800 mr-3"
                      />
                      <label htmlFor="morningRitual" className="text-sm font-bold">Ритуал приветствия выполнен</label>
                    </div>
                    <PhotoUpload
                      id="morningPhoto"
                      label="ФОТО КЛЕЙМА (НАДПИСЬ МАРКЕРОМ)"
                      photoId={state.currentDay.morningPhotoId}
                      onChange={(id) => updateDay({ morningPhotoId: id })}
                    />
                  </div>
                </section>

                {/* 2. Plug */}
                <section>
                  <h2 className="text-xl text-red-500 font-creep mb-4 border-b border-red-900 pb-2">II. ЗАПОЛНЕНИЕ <span className="text-xs text-red-700 align-middle ml-2">x{multiplier}</span></h2>
                  <p className="text-xs text-zinc-500 mb-2 font-mono">ЦЕЛЬ: {10 * multiplier} ЧАСОВ</p>
                  <Timer
                    label="ВРЕМЯ С ИГРУШКОЙ"
                    seconds={state.currentDay.plugTimeSeconds}
                    setSeconds={(s) => updateDay({ plugTimeSeconds: s })}
                    targetSeconds={36000 * multiplier}
                  />
                </section>

                {/* 3. Audio */}
                <section>
                  <h2 className="text-xl text-red-500 font-creep mb-4 border-b border-red-900 pb-2">III. ПРОГРАММИРОВАНИЕ <span className="text-xs text-red-700 align-middle ml-2">x{multiplier}</span></h2>
                  <p className="text-xs text-zinc-500 mb-2 font-mono">ЦЕЛЬ: {30 * multiplier} МИНУТ</p>
                  <Timer
                    label="АУДИО-СЕССИЯ"
                    seconds={state.currentDay.audioTimeSeconds}
                    setSeconds={(s) => updateDay({ audioTimeSeconds: s })}
                    targetSeconds={1800 * multiplier}
                  />
                </section>

                {/* 4. Humiliation */}
                <section>
                  <h2 className="text-xl text-red-500 font-creep mb-4 border-b border-red-900 pb-2">IV. СЧЁТЧИК ПОЗОРА <span className="text-xs text-red-700 align-middle ml-2">x{multiplier}</span></h2>
                  <Counter
                    label="КОЛИЧЕСТВО УНИЖЕНИЙ"
                    count={state.currentDay.humiliationCount}
                    setCount={(c) => updateDay({ humiliationCount: c })}
                    min={50 * multiplier}
                  />
                </section>

                {/* 5. Evening */}
                <section className="relative">
                  {/* ORGASM LOCK FULL BLOCKER */}
                  {isOrgasmLocked && (
                    <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center border-4 border-red-900 animate-pulse text-center p-4">
                      <h3 className="text-3xl text-red-600 font-creep mb-2">ДОСТУП ЗАПРЕЩЁН</h3>
                      <p className="text-white font-mono text-xl mb-4">ТЫ НАКАЗАНА. ОРГАЗМ НЕДОСТУПЕН.</p>
                      <div className="text-4xl font-black text-red-500">{lockHoursLeft} ЧАСОВ</div>
                    </div>
                  )}

                  <h2 className="text-xl text-red-500 font-creep mb-4 border-b border-red-900 pb-2">V. ФИНАЛ <span className="text-xs text-red-700 align-middle ml-2">x{multiplier}</span></h2>
                  <Counter
                    label="ПОВТОРЕНИЯ ФРАЗЫ"
                    count={state.currentDay.eveningRitualCount}
                    setCount={(c) => updateDay({ eveningRitualCount: c })}
                    step={1}
                    min={100 * multiplier}
                    bigButton={true}
                  />

                  <div className={`bg-zinc-900 p-4 border ${isOrgasmLocked ? 'border-red-600 opacity-50 grayscale' : 'border-zinc-800'} mt-6 transition-all`}>
                    <label className="flex items-center mb-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.currentDay.eveningOrgasm}
                        disabled={isOrgasmLocked}
                        onChange={(e) => updateDay({ eveningOrgasm: e.target.checked })}
                        className="w-5 h-5 accent-red-600 mr-3"
                      />
                      <span className="text-sm font-bold text-zinc-300">
                        {isOrgasmLocked ? "ОРГАЗМ ЗАПРЕЩЁН. ТЕРПИ, МРАЗЬ." : "Был ли оргазм?"}
                      </span>
                    </label>

                    {state.currentDay.eveningOrgasm && (
                      <div className="animate-shake">
                        <p className="text-red-500 text-xs mb-2 font-bold font-mono">ДОКАЖИ ИЛИ БУДЕШЬ НАКАЗАНА</p>
                        <PhotoUpload
                          id="eveningPhoto"
                          label="ФОТО ФИНАЛА (ЛУЖА/ЛИЦО)"
                          photoId={state.currentDay.eveningPhotoId}
                          onChange={(id) => updateDay({ eveningPhotoId: id })}
                        />
                      </div>
                    )}
                  </div>
                </section>

                <button
                  onClick={handleSubmit}
                  disabled={isOrgasmLocked && state.currentDay.eveningOrgasm}
                  className="w-full py-6 bg-red-900 hover:bg-red-800 text-white font-creep text-3xl uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-transform active:scale-95 mt-8 mb-12 border-2 border-red-600 disabled:opacity-50 disabled:grayscale"
                >
                  ОТЧИТАТЬСЯ, СУКА
                </button>
              </div>
            ) : (
              <div className="text-center py-12 border border-zinc-800 bg-zinc-900/30">
                <h2 className="text-2xl text-white font-creep mb-4">ОТЧЁТ ПРИНЯТ</h2>
                <div className="text-7xl font-black text-red-600 mb-4 font-mono">{state.currentDay.score}</div>
                <p className="italic text-zinc-400 max-w-xs mx-auto mb-6">"{state.currentDay.feedback}"</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={handleExport} className="text-xs bg-zinc-800 border border-zinc-600 text-white px-4 py-3 uppercase hover:bg-zinc-700">
                    СКАЧАТЬ ОФИЦИАЛЬНЫЙ ОТЧЁТ
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <div className="text-right">
              <button onClick={handleExport} className="text-xs text-red-500 hover:text-red-400 uppercase font-bold">
                [ Экспорт всех данных ]
              </button>
            </div>
            {state.history.length === 0 && <p className="text-center text-zinc-600 py-10">История пуста.</p>}
            {state.history.map((item, idx) => (
              <div key={idx} className="bg-zinc-900 border-l-4 border-zinc-700 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-zinc-500 text-sm">{item.date}</span>
                  <span className={`font-bold font-mono ${item.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{item.score}</span>
                </div>
                <p className="text-sm italic text-zinc-300 mb-2">"{item.feedback}"</p>
                {item.punishment && (
                  <div className="mt-2 text-xs text-red-400 border border-red-900/50 p-2 bg-black">
                    <span className="font-bold">НАКАЗАНИЕ:</span> {item.punishment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* RESULT MODAL */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border-4 border-double border-red-600 w-full max-w-sm p-6 text-center relative shadow-[0_0_80px_rgba(220,38,38,0.5)]">
            <h2 className="text-4xl font-creep text-red-600 mb-2 tracking-wider">ВЕРДИКТ</h2>
            <div className="text-8xl font-black text-white my-6 font-mono">{state.currentDay.score}</div>
            <p className="text-lg text-zinc-300 mb-6 font-serif leading-tight">
              {state.currentDay.feedback}
            </p>
            {state.lastPunishment && (
              <div className="bg-red-950/50 border border-red-800 p-4 mb-6">
                <p className="text-xs text-red-400 uppercase font-bold mb-1 animate-pulse">Назначено наказание:</p>
                <p className="text-white text-sm">{state.lastPunishment}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={handleExport} className="w-full py-2 bg-zinc-800 text-white text-xs uppercase hover:bg-zinc-700">
                СКАЧАТЬ ОТЧЁТ
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-3 bg-red-700 text-white font-bold uppercase hover:bg-red-600"
              >
                ПОВИНУЮСЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebugOverlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(139,0,0,0.9)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '50px',
          fontWeight: 'bold',
          zIndex: 99999,
          textAlign: 'center',
          animation: 'blink 1s infinite'
        }}>
          ЭТА КОНЧЕННАЯ ДЫРА НАЖАЛА КНОПКУ — СТРАДАЙ, МРАЗЬ!
        </div>
      )}

    </div>
  );
};

export default App;