
import React, { useEffect, useState } from 'react';
import { DayRepository } from '@/lib/db';
import { DayPlan } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LucideCalendar, LucideHistory, LucideDownload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateHtmlReport } from '@/lib/services/reports';
import { Button } from '@/components/ui/button';

export const Journal: React.FC = () => {
    const [history, setHistory] = useState<DayPlan[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            const data = await DayRepository.getAll();
            setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
        };
        loadHistory();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-creep text-zinc-100 uppercase tracking-widest">Life Journal</h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={generateHtmlReport}
                    className="border-zinc-800 text-zinc-500 hover:text-red-500"
                >
                    <LucideDownload className="w-4 h-4 mr-2" />
                    EXPORT
                </Button>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 text-zinc-700 font-mono text-xs uppercase">
                    The void is empty. Suffer more.
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((day) => (
                        <Card key={day.date} className="bg-zinc-950/50 border-zinc-900">
                            <CardHeader className="py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                                    <LucideCalendar className="w-3 h-3" />
                                    {day.date}
                                </CardTitle>
                                <div className={cn(
                                    "text-xs font-bold",
                                    day.scarcityScore >= 70 ? "text-emerald-500" : "text-red-600"
                                )}>
                                    SCORE: {day.scarcityScore}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3 text-[10px] text-zinc-400 font-mono flex justify-between uppercase">
                                <div className="flex gap-4">
                                    <span>BODY: {day.domains.body.completed ? 'OK' : 'FAIL'}</span>
                                    <span>MIND: {day.domains.meaning.completed ? 'OK' : 'FAIL'}</span>
                                </div>
                                <div className="text-zinc-600">
                                    LVL {day.escalationLevel}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
