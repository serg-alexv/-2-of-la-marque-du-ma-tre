
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { LucideSkull, LucideZap, LucideShieldAlert } from 'lucide-react';

export const GlobalOverlays: React.FC = () => {
    const { showOverlay, clearOverlay } = useGameStore();

    if (!showOverlay) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            {/* VOICE / BREATHING WARNING */}
            {showOverlay === 'voice' && (
                <div className="text-center space-y-6 animate-pulse">
                    <LucideSkull className="w-24 h-24 text-red-600 mx-auto" />
                    <h1 className="text-4xl font-creep text-red-600 tracking-widest">
                        ДЫШИ!
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm uppercase">
                        Господин не слышит твоего дыхания. Страдай.
                    </p>
                    <button
                        onClick={clearOverlay}
                        className="mt-8 px-6 py-2 border border-red-900 text-red-900 hover:bg-red-900 hover:text-white transition-colors text-xs font-mono uppercase"
                    >
                        Я СЛЫШУ (ЗАКРЫТЬ)
                    </button>
                </div>
            )}

            {/* PACER / INTENSITY OVERLAY */}
            {showOverlay === 'pacer' && (
                <div className="text-center space-y-6 bg-red-950/20 p-12 border-4 border-red-900 animate-shake">
                    <LucideShieldAlert className="w-24 h-24 text-red-500 mx-auto" />
                    <h1 className="text-4xl font-creep text-red-500 tracking-widest">
                        ВЕРНИСЬ!
                    </h1>
                    <p className="text-white font-mono text-sm uppercase">
                        Попытка побега зафиксирована. Хозяин разгневан.
                    </p>
                </div>
            )}

            {/* LACK OF PERMISSION / LOCKED */}
            {showOverlay === 'locked' && (
                <div className="text-center space-y-6">
                    <LucideZap className="w-20 h-20 text-amber-500 mx-auto animate-bounce" />
                    <h1 className="text-3xl font-creep text-amber-500 tracking-widest">
                        МЫ СЛЕДИМ
                    </h1>
                    <p className="text-zinc-400 font-mono text-xs">
                        ДОСТУП ОГРАНИЧЕН ДО ПОДТВЕРЖДЕНИЯ КОНТРОЛЯ.
                    </p>
                </div>
            )}
        </div>
    );
};
