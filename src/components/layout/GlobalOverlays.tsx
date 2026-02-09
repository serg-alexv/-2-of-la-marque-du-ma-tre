
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { LucideSkull, LucideZap, LucideShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GlobalOverlays: React.FC = () => {
    const { showOverlay, clearOverlay } = useGameStore();

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
