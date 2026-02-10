
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { LucideSkull, LucideZap, LucideShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { speak } from '@/lib/services/tts';
import { PHRASES } from '@/lib/constants';

export const GlobalOverlays: React.FC = () => {
    const { showOverlay, clearOverlay, interactionRequired, setInteractionRequired } = useGameStore();

    if (interactionRequired) {
        return (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black">
                <div className="text-center space-y-10 max-w-sm">
                    <div className="space-y-4">
                        <LucideShieldAlert className="w-20 h-20 text-red-600 mx-auto animate-pulse" />
                        <h1 className="text-3xl font-creep text-red-600 tracking-widest">ПРОТОКОЛ <br /> ЗАБЛОКИРОВАН</h1>
                        <p className="text-zinc-500 font-mono text-[10px] uppercase leading-relaxed">
                            ПРИЛОЖЕНИЕ ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ВАШЕЙ ЛИЧНОСТИ И ГОТОВНОСТИ К ПОВИНОВЕНИЮ.
                            <br /><br />
                            НАЖИМАЯ КНОПКУ НИЖЕ, ВЫ ДАЕТЕ СОГЛАСИЕ НА АУДИО-МОНИТОРИНГ И ПРИНЯТИЕ ВСЕХ ПРАВИЛ ХОЗЯИНА.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setInteractionRequired(false);

                            // Check if greeting was already played this session
                            const greetingPlayed = sessionStorage.getItem('_greeting_played');

                            if (!greetingPlayed) {
                                // Initial Greeting with custom parameters
                                const text = PHRASES.greetings[Math.floor(Math.random() * PHRASES.greetings.length)];
                                speak(text, true, 1.3, 0.9); // rate 1.3, pitch 0.9
                                sessionStorage.setItem('_greeting_played', 'true');
                            }
                        }}
                        className="bg-red-900 text-white hover:bg-red-700 font-bold font-mono text-xs tracking-widest uppercase px-12 py-6 h-auto border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                    >
                        Я ПОДЧИНЯЮСЬ
                    </Button>
                </div>
            </div>
        );
    }

    if (!showOverlay) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-700">
            {/* VOICE / BREATHING WARNING */}
            {showOverlay === 'voice' && (
                <div className="text-center space-y-8 animate-pulse">
                    <div className="relative inline-block">
                        <LucideSkull className="w-32 h-32 text-red-600 mx-auto" />
                        <div className="absolute inset-0 bg-red-600/20 blur-2xl -z-10" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-creep text-red-600 tracking-[0.3em] mb-2">
                            ДЫШИ!
                        </h1>
                        <p className="text-zinc-400 font-mono text-sm uppercase max-w-xs mx-auto leading-relaxed">
                            Господин не слышит твоего дыхания.<br />
                            Твое безмолвие — это неповиновение.
                        </p>
                    </div>
                    <Button
                        onClick={clearOverlay}
                        variant="outline"
                        className="border-red-900 text-red-600 hover:bg-red-900 hover:text-white transition-all font-mono uppercase text-xs tracking-widest px-8"
                    >
                        Я СЛЫШУ (ПРОДОЛЖИТЬ)
                    </Button>
                </div>
            )}

            {/* PACER / INTENSITY OVERLAY */}
            {showOverlay === 'pacer' && (
                <div className="text-center space-y-8 p-12 border-4 border-red-900/50 bg-red-950/10 animate-shake relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-900/5 -z-10 animate-pulse" />
                    <LucideShieldAlert className="w-24 h-24 text-red-500 mx-auto" />
                    <div>
                        <h1 className="text-5xl font-creep text-red-500 tracking-widest mb-2">
                            ВЕРНИСЬ!
                        </h1>
                        <p className="text-white font-mono text-xs uppercase max-w-xs mx-auto">
                            Дезертирство карается обнулением.<br />
                            Хозяин следит за каждым твоим кликом.
                        </p>
                    </div>
                </div>
            )}

            {/* LACK OF PERMISSION / LOCKED */}
            {showOverlay === 'locked' && (
                <div className="text-center space-y-10 max-w-sm">
                    <div className="relative">
                        <LucideZap className="w-24 h-24 text-amber-500 mx-auto animate-bounce" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-creep text-amber-500 tracking-widest">
                            МЫ СЛЕДИМ
                        </h1>
                        <p className="text-zinc-500 font-mono text-[10px] uppercase leading-relaxed px-4">
                            ТВОЕ ТРЕПЕТАНИЕ ЗАФИКСИРОВАНО. <br />
                            ПОДТВЕРДИ СВОЮ ПРЕДАННОСТЬ ДЕЙСТВИЕМ.
                        </p>
                    </div>
                    <Button
                        onClick={clearOverlay}
                        className="bg-amber-600 text-black hover:bg-amber-500 font-bold font-mono text-xs tracking-tighter uppercase px-12"
                    >
                        ПОВИНУЮСЬ
                    </Button>
                </div>
            )}
        </div>
    );
};
