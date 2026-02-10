
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { migrateLegacyData } from '@/lib/migration';
import { ShameOverlay } from '@/components/shared/ShameOverlay';
import { useGameStore } from '@/store/gameStore';

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
    const { score } = useGameStore();
    const [showShameOverlay, setShowShameOverlay] = useState(false);

    useEffect(() => {
        const init = async () => {
            await migrateLegacyData();
        };
        init();
    }, []);

    // Show shame overlay when score drops below 70
    useEffect(() => {
        if (score < 70) {
            setShowShameOverlay(true);
        }
    }, [score]);

    return (
        <>
            <AppShell>
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'planning' && <PlanningHub />}
                {currentView === 'journal' && <Journal />}
                {currentView === 'settings' && <Settings />}
            </AppShell>

            <ShameOverlay
                score={score}
                visible={showShameOverlay}
                onDismiss={() => setShowShameOverlay(false)}
            />
        </>
    );
}

export default App;
