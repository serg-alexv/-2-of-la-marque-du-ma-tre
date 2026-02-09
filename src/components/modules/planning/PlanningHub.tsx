
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming Shadcn/Radix
import { LucideCalendar, LucideUsers, LucideFlag, LucideLayout } from 'lucide-react';

export const PlanningHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-creep text-center text-zinc-100 uppercase tracking-widest mb-6">Execution Protocol</h1>

            {/* TABS (Simplified without Radix for now) */}
            <div className="flex border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex-1 p-3 text-sm font-mono uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'weekly' ? 'border-red-600 text-red-500' : 'border-transparent text-zinc-600'}`}
                >
                    Weekly Cycle
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`flex-1 p-3 text-sm font-mono uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'monthly' ? 'border-red-600 text-red-500' : 'border-transparent text-zinc-600'}`}
                >
                    Clean Slate
                </button>
            </div>

            {activeTab === 'weekly' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-l-4 border-l-purple-900 bg-zinc-950/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-purple-400 flex items-center gap-2">
                                <LucideLayout className="w-4 h-4" /> Board Meeting
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-zinc-400">
                            <div className="p-2 border border-zinc-800 rounded flex justify-between">
                                <span>CEO (Strategy)</span>
                                <span className="text-zinc-600">Pending</span>
                            </div>
                            <div className="p-2 border border-zinc-800 rounded flex justify-between">
                                <span>COACH (Tactics)</span>
                                <span className="text-zinc-600">Pending</span>
                            </div>
                            <div className="p-2 border border-zinc-800 rounded flex justify-between">
                                <span>LOVER (Reward)</span>
                                <span className="text-zinc-600">Pending</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-900 bg-zinc-950/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-red-500 flex items-center gap-2">
                                <LucideFlag className="w-4 h-4" /> The 1 Rule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-zinc-100 text-center p-4 border border-dashed border-zinc-800">
                                NO SOCIAL MEDIA BEFORE NOON
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'monthly' && (
                <div className="text-center py-12 text-zinc-600 font-mono text-xs uppercase animate-in fade-in">
                    Contribution Capsule Required to Unlock
                </div>
            )}
        </div>
    );
};
