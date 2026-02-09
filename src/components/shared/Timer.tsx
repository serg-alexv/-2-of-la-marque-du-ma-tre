
import React, { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils'; // I should add formatTime to utils.ts too

interface TimerProps {
    label: string;
    seconds: number;
    isActive: boolean;
    onSecond: (total: number) => void;
    target?: number;
}

export const Timer: React.FC<TimerProps> = ({ label, seconds, isActive, onSecond, target }) => {
    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                onSecond(seconds + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const progress = target ? Math.min(100, (seconds / target) * 100) : 0;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">{label}</label>
                <div className="text-zinc-100 font-mono font-bold text-sm tracking-tighter">
                    {Math.floor(seconds / 3600)}h {Math.floor((seconds % 3600) / 60)}m {seconds % 60}s
                </div>
            </div>
            <div className="h-1 bg-zinc-900 w-full overflow-hidden">
                <div
                    className="h-full bg-red-900 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
