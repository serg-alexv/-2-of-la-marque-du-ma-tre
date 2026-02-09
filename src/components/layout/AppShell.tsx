
import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from '@/App';
import { cn } from '@/lib/utils';
import { LucideZap, LucideCloudRain, LucideShield, LucideSkull, LucideZap as LucideZapIcon, LucideHistory, LucideSettings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayPlan } from '@/types';
import { GlobalOverlays } from './GlobalOverlays';
import { useEnforcement } from '@/hooks/useEnforcement';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { score, escalationLevel, initialize, currentDay } = useGameStore();
    const { currentView, nav } = useRouter();
    const [loading, setLoading] = useState(true);

    // Activate background enforcement logic
    useEnforcement();

    useEffect(() => {
        // Initialize Logic (DB, State, Audio)
        const init = async () => {
            await initialize();
            setLoading(false);
        };
        init();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="animate-pulse font-creep text-xl">LOADING PROTOCOL...</div>
        </div>
    );

    return (
        <div className={cn(
            "min-h-screen bg-black text-zinc-100 font-sans tracking-tight selection:bg-red-900/50 transition-all duration-700",
            escalationLevel === 1 && "border-[4px] border-amber-900/50",
            escalationLevel === 2 && "border-[8px] border-amber-900 animation-pulse",
            escalationLevel === 3 && "border-[12px] border-red-900 animate-pulse",
            escalationLevel === 4 && "border-[16px] border-red-600 animate-bounce blur-[0.5px]" // Visual chaos
        )}>

            {/* HEADER / STATUS BAR */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-offset-2 ring-offset-black",
                        score > 90 ? "bg-emerald-900 ring-emerald-600 text-emerald-200" :
                            score > 70 ? "bg-amber-900 ring-amber-600 text-amber-200" :
                                "bg-red-900 ring-red-600 text-red-200 animate-pulse"
                    )}>
                        {score}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase">La Marque</h1>
                        <div className="text-[10px] text-zinc-500 font-mono">
                            LEVEL {escalationLevel} • {currentDay?.date}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {escalationLevel === 0 && <LucideShield className="w-5 h-5 text-emerald-600" />}
                    {escalationLevel > 0 && <LucideZap className="w-5 h-5 text-amber-500 animate-pulse" />}
                    {escalationLevel > 3 && <LucideSkull className="w-5 h-5 text-red-600 animate-bounce" />}
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="pt-20 pb-24 px-4 max-w-md mx-auto relative z-10">
                {children}
            </main>

            {/* BOTTOM NAV (Replaces Monolith Buttons) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 flex justify-around p-2 z-50">
                <Button
                    variant="ghost"
                    onClick={() => nav('dashboard')}
                    className={cn(
                        "flex-1 flex flex-col gap-1 h-auto py-2 text-[10px] transition-colors",
                        currentView === 'dashboard' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-white"
                    )}
                >
                    <LucideZapIcon className="w-5 h-5" />
                    <span className="font-mono font-bold">STATUS</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => nav('planning')}
                    className={cn(
                        "flex-1 flex flex-col gap-1 h-auto py-2 text-[10px] transition-colors",
                        currentView === 'planning' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-white"
                    )}
                >
                    <LucideCloudRain className="w-5 h-5" />
                    <span className="font-mono font-bold">PLAN</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => nav('journal')}
                    className={cn(
                        "flex-1 flex flex-col gap-1 h-auto py-2 text-[10px] transition-colors",
                        currentView === 'journal' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-white"
                    )}
                >
                    <LucideHistory className="w-5 h-5" />
                    <span className="font-mono font-bold">LOGS</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => nav('settings')}
                    className={cn(
                        "flex-1 flex flex-col gap-1 h-auto py-2 text-[10px] transition-colors",
                        currentView === 'settings' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-white"
                    )}
                >
                    <LucideSettings className="w-5 h-5" />
                    <span className="font-mono font-bold">CONFIG</span>
                </Button>
            </nav>

            {/* GLOBAL OVERLAYS (Escalation, Mic Permission, Pacer) */}
            <GlobalOverlays />
        </div>
    );
};
