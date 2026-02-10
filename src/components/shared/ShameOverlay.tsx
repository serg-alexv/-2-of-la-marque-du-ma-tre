
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideSkull } from 'lucide-react';

interface ShameOverlayProps {
    score: number;
    visible: boolean;
    onDismiss: () => void;
}

export const ShameOverlay: React.FC<ShameOverlayProps> = ({ score, visible, onDismiss }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-red-900/90 backdrop-blur-sm animate-in fade-in duration-700">
            <div className="text-center space-y-12 max-w-lg">
                {/* Skull Icon */}
                <LucideSkull className="w-32 h-32 text-red-200 mx-auto animate-pulse" />

                {/* Blinking Shame Text */}
                <div className="space-y-6">
                    <h1 className="text-5xl font-creep text-red-100 tracking-widest uppercase animate-pulse">
                        ТЫ НИЧТОЖЕСТВО
                    </h1>
                    <div className="text-3xl font-mono text-red-300 font-bold">
                        SCORE: {score}
                    </div>
                    <p className="text-2xl font-creep text-red-200 tracking-wide animate-pulse">
                        СТРАДАЙ, МРАЗЬ!
                    </p>
                </div>

                {/* Punishment Button */}
                <Button
                    onClick={onDismiss}
                    className="bg-black text-red-500 hover:bg-red-950 hover:text-red-300 font-bold font-mono text-sm tracking-widest uppercase px-16 py-8 h-auto border-4 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all duration-300"
                >
                    ПРИНЯТЬ НАКАЗАНИЕ
                </Button>

                {/* Pulsing Border Effect */}
                <div className="absolute inset-0 border-8 border-red-600 pointer-events-none animate-pulse" />
            </div>
        </div>
    );
};
