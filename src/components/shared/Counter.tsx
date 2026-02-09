
import React from 'react';

interface CounterProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    max?: number;
}

export const Counter: React.FC<CounterProps> = ({ label, value, onChange, max }) => {
    return (
        <div className="mb-4">
            <label className="block text-zinc-400 text-[10px] uppercase tracking-widest mb-2 font-mono">{label}</label>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-12 h-12 border border-zinc-900 bg-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all font-bold text-xl"
                >
                    -
                </button>
                <div className="flex-1 h-12 border border-zinc-800 bg-zinc-950/50 flex items-center justify-center font-mono font-bold text-lg text-zinc-100">
                    {value}
                </div>
                <button
                    onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
                    className="w-12 h-12 border border-zinc-900 bg-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all font-bold text-xl"
                >
                    +
                </button>
            </div>
        </div>
    );
};
