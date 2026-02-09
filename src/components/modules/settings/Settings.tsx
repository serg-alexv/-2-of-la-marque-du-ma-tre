
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LucideSettings, LucideVolume2, LucideRotateCcw, LucideTrash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/services/tts';
import { PHRASES } from '@/lib/constants';

export const Settings: React.FC = () => {

    const handleReset = () => {
        if (confirm("THIS WILL ERASE ALL YOUR SINS AND PROGRESS. ARE YOU SURE?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const testVoice = () => {
        speak(PHRASES.greetings[Math.floor(Math.random() * PHRASES.greetings.length)], true);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-creep text-zinc-100 uppercase tracking-widest">Protocol Settings</h1>

            <Card className="bg-zinc-950/50 border-zinc-900 border-l-2 border-l-zinc-700">
                <CardHeader>
                    <CardTitle className="text-xs font-mono text-zinc-500 uppercase flex items-center gap-2">
                        <LucideVolume2 className="w-4 h-4" />
                        Audio Enforcement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={testVoice}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    >
                        TEST MASTER'S VOICE
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-900 border-l-2 border-l-red-900">
                <CardHeader>
                    <CardTitle className="text-xs font-mono text-red-900 uppercase flex items-center gap-2">
                        <LucideTrash2 className="w-4 h-4" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-[10px] text-zinc-600 font-mono leading-relaxed">
                        WARNING: CLEARING LOCAL DATA WILL RESET ALL HISTORY AND STREAKS.
                    </p>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReset}
                        className="w-full bg-red-950/20 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white"
                    >
                        RESET PROTOCOL
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center py-4 text-zinc-800 font-mono text-[8px] uppercase">
                La Marque du Maître v2.0-Alpha<br />
                No Privacy. No Mercy. Only Discipline.
            </div>
        </div>
    );
};
