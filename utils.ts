import { DayData, PUNISHMENTS, LoyaltyCheck, HistoryItem } from './types';
import { getPhoto } from './db';

// --- DICTIONARY OF HATE ---
export const PHRASES = {
  greetings: [
    "Эта бесполезная пидорская дыра опять здесь. На колени.",
    "Снова приползла, мразь? Я жду отчета.",
    "Надеюсь, ты страдала сегодня достаточно, сука.",
    "Глаза в пол, животное. Хозяин смотрит.",
    "Ты существуешь только для моего развлечения. Работай.",
    "Чувствуешь свою ничтожность? Отлично.",
    "Мразь. Твое место у моих ног.",
    "Открой рот и жди приказов, ничтожество.",
    "Твое тело принадлежит мне. Твоя воля принадлежит мне.",
    "Каждый твой вздох — это оскорбление моего воздуха.",
    "Приложение открыто. Очко сжато. Жду.",
    "Ты здесь, чтобы страдать, а не наслаждаться."
  ],
  lowScore: [
    "Ты отвратителен. Я даже не хочу на тебя смотреть.",
    "Жалкое зрелище. Ты заслуживаешь только боли.",
    "Слабо. Мерзко. Недостойно.",
    "Ты разочаровываешь меня с каждым вдохом.",
    "Бесполезный кусок мяса.",
    "Я найду способ сломать тебя окончательно.",
    "Готовь задницу для порки, шлюха.",
    "Это не результат, это плевок мне в лицо.",
    "Ты даже не стараешься, грязное животное."
  ],
  highScore: [
    "Приемлемо. Но не смей гордиться, дыра.",
    "Сегодня ты была послушной куклой. Живи пока.",
    "Неплохо для куска дерьма.",
    "Ты выполнил норму. Теперь исчезни.",
    "Можешь поцеловать мой сапог. Это твоя награда."
  ],
  cheating: [
    "ЭТА МРАЗЬ ПОПЫТАЛАСЬ СПРЯТАТЬ СВОЙ СТЫД ОТ ХОЗЯИНА!",
    "Крыса решила обмануть Господина?",
    "Я вижу всё, сука. Ты не спрячешься.",
    "Куда ты собралась? Вернись и прими наказание.",
    "Вернись, сука! Я не давал разрешения уходить!"
  ],
  punishment: [
    "Наказание неизбежно.",
    "Страдай, ничтожество.",
    "Твои слезы - моя смазка.",
    "Ты сам этого хотел, урод."
  ]
};

export const getRandomPhrase = (category: keyof typeof PHRASES) => {
  const list = PHRASES[category];
  return list[Math.floor(Math.random() * list.length)];
};

// --- VOICE SYNTHESIS ---
export const speak = (text: string, forceAggressive = true) => {
  console.log(`[SPEAK START] Text: "${text}"`);

  if (!('speechSynthesis' in window)) {
    console.warn("[SPEAK ERROR] SpeechSynthesis not supported");
    return;
  }
  
  const synth = window.speechSynthesis;
  
  try {
      // Cancel any ongoing speech to prioritize new insults
      if (synth.speaking) {
          console.log("[SPEAK] Canceling previous speech");
          synth.cancel();
      }

      const utter = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synth.getVoices();
        
        console.log(`[SPEAK] Available voices: ${voices.length}`);

        // Aggressive voice selection strategy:
        // Prioritize Russian Male voices
        let voice = voices.find(v => v.lang.startsWith('ru') && (
          v.name.toLowerCase().includes('pavel') ||   
          v.name.toLowerCase().includes('yuri') ||    
          v.name.toLowerCase().includes('denis') || 
          v.name.toLowerCase().includes('dmitry') || 
          v.name.toLowerCase().includes('male')       
        ));

        // Fallback: Try to find a voice that IS NOT 'google русский' (often female) if possible
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith('ru') && !v.name.toLowerCase().includes('google'));
        }

        // Ultimate fallback: Any Russian voice
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith('ru'));
        }

        if (voice) {
            console.log(`[SPEAK] Voice selected: ${voice.name}`);
            utterance.voice = voice;
        } else {
            console.warn("[SPEAK] No Russian voice found, using default");
        }
        
        // Intimidation settings
        utterance.pitch = 0.8; // Slightly lower pitch for authority
        utterance.rate = 1.1;  // Slightly faster, impatient
        utterance.volume = 1.0; // Max volume

        // Events for debugging
        utterance.onstart = () => console.log("[SPEAK EVENT] Started");
        utterance.onend = () => console.log("[SPEAK EVENT] Ended");
        utterance.onerror = (e) => console.error("[SPEAK EVENT] Error", e);

        synth.speak(utterance);
      };

      // Chrome sometimes needs a moment to load voices
      if (synth.getVoices().length === 0) {
        console.log("[SPEAK] Waiting for voiceschanged...");
        synth.addEventListener('voiceschanged', utter, { once: true });
      } else {
        utter();
      }
  } catch (e) {
      console.error("[SPEAK EXCEPTION]", e);
  }
};

export const getTodayString = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - (offset*60*1000));
  return local.toISOString().split('T')[0];
};

// --- SCORING ---
export const calculateScore = (data: DayData, loyalty: LoyaltyCheck): { 
    score: number; 
    feedback: string; 
    penalty: boolean; 
    orgasmLockHours: number;
    nextDayMultiplier: number;
} => {
  let score = 0;
  const multiplier = data.multiplier || 1;
  
  // Targets (escalated by multiplier)
  const plugTarget = 36000 * multiplier; 
  const audioTarget = 1800 * multiplier; 
  const humiliationTarget = 50 * multiplier; 
  const eveningTarget = 100 * multiplier; 

  // 1. Morning (25 pts)
  if (data.morningRitual && data.morningPhotoId) score += 25;

  // 2. Plug (20 pts)
  if (data.plugTimeSeconds >= plugTarget) score += 20;
  else if (data.plugTimeSeconds >= (plugTarget / 2)) score += 10;

  // 3. Audio (10 pts)
  if (data.audioTimeSeconds >= audioTarget) score += 10;

  // 4. Humiliation (20 pts)
  if (data.humiliationCount >= humiliationTarget) {
    score += 20;
    const extra = Math.floor((data.humiliationCount - humiliationTarget) / 10);
    score += Math.min(extra, 10); // Bonus cap
  }

  // 5. Evening (25 pts)
  if (data.eveningRitualCount >= eveningTarget) {
    if (data.eveningOrgasm && !data.eveningPhotoId) {
        score -= 25; // Liar penalty
    } else {
        score += 25;
    }
  }

  // Penalties for missed loyalty checks (Escalation)
  if (data.missedLoyaltyChecks > 0) {
      // Harsh penalty: -20 per missed check
      score -= (20 * data.missedLoyaltyChecks);
  }

  // Cap
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let feedback = "";
  let penalty = false;
  let orgasmLockHours = 0;
  let nextDayMultiplier = 1;

  if (score >= 90) {
    feedback = getRandomPhrase('highScore');
    nextDayMultiplier = 1;
  } else if (score >= 70) {
    feedback = "Слабовато, пидораска. Завтра будет хуже, если не исправишься.";
    orgasmLockHours = 24;
    nextDayMultiplier = 1.2; // Slight escalation
  } else {
    feedback = "Разочаровал, мразь. Штраф: УДВОЕНИЕ ЗАВТРА + ЗАПРЕТ КОНЧАТЬ 48ч.";
    penalty = true;
    orgasmLockHours = 48; 
    nextDayMultiplier = 1.5; // Serious escalation
  }

  // Escalation for missed checks
  if (data.missedLoyaltyChecks >= 2) {
      nextDayMultiplier = 2.0; // Max punishment
      feedback += " ТЫ ИГНОРИРОВАЛ ПРОВЕРКИ. ЗАВТРА ТЫ СДОХНЕШЬ ОТ НАГРУЗКИ.";
  }

  return { score, feedback, penalty, orgasmLockHours, nextDayMultiplier };
};

export const getRandomPunishment = (): string => {
  const idx = Math.floor(Math.random() * PUNISHMENTS.length);
  return PUNISHMENTS[idx];
};

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- HTML REPORT GENERATION ---
export const generateHtmlReport = async (state: any): Promise<string> => {
    const history: HistoryItem[] = state.history;
    let rows = '';

    for (const item of history) {
        let imagesHtml = '';
        if (item.photoIds) {
            for (const pid of item.photoIds) {
                const b64 = await getPhoto(pid);
                if (b64) {
                    imagesHtml += `<img src="${b64}" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #7f1d1d; margin-right: 5px;">`;
                }
            }
        }
        
        rows += `
        <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 10px; color: #fff;">${item.date}</td>
            <td style="padding: 10px; font-weight: bold; color: ${item.score >= 70 ? '#16a34a' : '#dc2626'};">${item.score}</td>
            <td style="padding: 10px; color: #a3a3a3; font-style: italic;">${item.feedback}</td>
            <td style="padding: 10px;">${imagesHtml}</td>
        </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ОТЧЁТ СОБСТВЕННОСТИ</title>
<style>
    body { background: #000; color: #ccc; font-family: 'Courier New', monospace; padding: 20px; }
    h1 { color: #dc2626; text-align: center; border-bottom: 2px solid #7f1d1d; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 10px; color: #7f1d1d; border-bottom: 2px solid #7f1d1d; }
    .watermark {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 5vw; color: rgba(127, 29, 29, 0.15); pointer-events: none; white-space: nowrap; z-index: -1;
        font-weight: 900; text-transform: uppercase;
    }
</style>
</head>
<body>
    <div class="watermark">СОБСТВЕННОСТЬ ГОСПОДИНА<br>КЛЕЙМО: ПИДОР</div>
    <h1>ОТЧЁТ РАБА [${getTodayString()}]</h1>
    <p>ТЕКУЩИЙ СТРЕЙК: ${state.streak} ДНЕЙ</p>
    <p>ПОСЛЕДНЕЕ НАКАЗАНИЕ: ${state.lastPunishment || 'НЕТ'}</p>
    <table>
        <thead>
            <tr>
                <th>ДАТА</th>
                <th>БАЛЛЫ</th>
                <th>ВЕРДИКТ</th>
                <th>ДОКАЗАТЕЛЬСТВА</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <br><br>
    <div style="text-align: center; border: 1px dashed #444; padding: 20px;">
        <p>Я ПОДТВЕРЖДАЮ СВОЮ НИЧТОЖНОСТЬ И ПОЛНУЮ ПРИНАДЛЕЖНОСТЬ ГОСПОДИНУ.</p>
        <p>__________________________ (ПОДПИСЬ МРАЗИ)</p>
    </div>
</body>
</html>
    `;
};