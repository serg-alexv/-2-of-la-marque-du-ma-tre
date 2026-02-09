
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideShield, LucideBrain, LucidePalette, LucideUsers, LucideHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LifeDomain } from '@/types';
import BreathingMonitor from '../enforcement/BreathingMonitor';

export const Dashboard: React.FC = () => {
    const { currentDay, score, updateDay } = useGameStore();

    if (!currentDay) return null;

    const domains = currentDay.domains;
    const toggleDomain = (key: LifeDomain) => {
        const val = domains[key].completed;
        updateDay({
            domains: {
                ...domains,
                [key]: { ...domains[key], completed: !val, value: !val ? 1 : 0 }
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* SCORE HEADER */}
            <div className="text-center py-8 relative">
                <div className="inline-block relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                            className={cn(
                                "transition-all duration-1000 ease-out",
                                score > 70 ? "text-emerald-500" : "text-red-500"
                            )}
                            strokeDasharray={364}
                            strokeDashoffset={364 - (364 * score) / 100}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold font-mono">{score}</span>
                        <span className="text-[10px] uppercase text-zinc-500">SCARCITY SCORE</span>
                    </div>
                </div>
            </div>

            {/* 5 DOMAINS GRID */}
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(domains).map(([key, domain]) => {
                    const Icon = {
                        body: LucideShield,
                        meaning: LucideBrain,
                        creation: LucidePalette,
                        connection: LucideUsers,
                        intimacy: LucideHeart,
                    }[key as LifeDomain];

                    return (
                        <button
                            key={key}
                            onClick={() => toggleDomain(key as LifeDomain)}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95",
                                domain.completed
                                    ? "bg-zinc-900 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                    : "bg-black border-zinc-900 opacity-60"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 mb-2", domain.completed ? "text-white" : "text-zinc-600")} />
                            <div className="text-xs uppercase font-bold tracking-wider">{key}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{domain.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* ENFORCEMENT MODULES */}
            <BreathingMonitor />

            {/* DAILY PROTOCOL (Sprint/Ignition) */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-sm font-mono text-zinc-400 uppercase">Daily Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Morning Ignition */}
                    <div className="flex items-center justify-between p-3 border border-zinc-900 rounded bg-black/50">
                        <div className="text-xs font-bold text-zinc-300">MORNING IGNITION</div>
                        <div className={cn("w-2 h-2 rounded-full", currentDay.morningIgnition.completedAt ? "bg-green-500" : "bg-red-900 animate-pulse")} />
                    </div>

                    {/* Midday Sprint */}
                    <div className="flex items-center justify-between p-3 border border-zinc-900 rounded bg-black/50">
                        <div className="text-xs font-bold text-zinc-300">MIDDAY SPRINT (25m)</div>
                        <div className="text-xs font-mono text-zinc-500">{currentDay.middaySprint.focusTime}m</div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};
