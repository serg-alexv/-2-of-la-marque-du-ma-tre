
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { migrateLegacyData } from '@/lib/migration';

// Placeholder Pages (Will be in modules)
import { Dashboard } from './components/modules/dashboard/Dashboard';
import { PlanningHub } from './components/modules/planning/PlanningHub';
import { Journal } from './components/modules/journal/Journal';
import { Settings } from './components/modules/settings/Settings';

// Zustand Store for simple routing (can upgrade to React Router later)
import { create } from 'zustand';

interface RouterState {
    currentView: 'dashboard' | 'planning' | 'journal' | 'settings';
    nav: (view: 'dashboard' | 'planning' | 'journal' | 'settings') => void;
}

export const useRouter = create<RouterState>((set) => ({
    currentView: 'dashboard',
    nav: (view) => set({ currentView: view }),
}));

function App() {
    const { currentView } = useRouter();

    useEffect(() => {
        const init = async () => {
            await migrateLegacyData();
        };
        init();
    }, []);

    return (
        <AppShell>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'planning' && <PlanningHub />}
            {currentView === 'journal' && <Journal />}
            {currentView === 'settings' && <Settings />}
        </AppShell>
    );
}

export default App;
