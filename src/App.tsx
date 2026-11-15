import React, { useState } from 'react';
import { SvgFilters } from './theme/SvgFilters';
import { AppShell } from './layouts/AppShell';
import { DesignShowcase } from './app/DesignShowcase';
import { useHeatHaze } from './components/useHeatHaze';
import { QualityMode } from './theme/tokens';
import { EmberCanvas } from './components/EmberCanvas';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'app' | 'design'>('app');
  const [quality, setQuality] = useState<QualityMode>('high');
  const [isDaylight, setIsDaylight] = useState<boolean>(false);

  // Activate subtle thermal heat haze animation on SVG filter
  useHeatHaze({
    enabled: quality === 'high' && !isDaylight,
    speed: 0.0004,
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDaylight ? 'bg-slate-100 text-slate-900' : 'bg-obsidian-950 text-slate-100'}`}>
      {/* Global SVG Filters for liquid glass refraction & gooey drops */}
      <SvgFilters />

      {/* Background Molten Embers (pointer-events-none so it never blocks clicks) */}
      <EmberCanvas maxParticles={quality === 'high' ? 25 : quality === 'medium' ? 12 : 0} className="fixed inset-0 pointer-events-none z-0" />

      {/* Main View Area */}
      <main className="relative z-10 min-h-screen">
        {currentView === 'design' ? (
          <div className="p-4">
            <button
              onClick={() => setCurrentView('app')}
              className="mb-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs"
            >
              ← Back to ChronoForge ERP
            </button>
            <DesignShowcase />
          </div>
        ) : (
          <AppShell
            isDaylight={isDaylight}
            onToggleDaylight={() => setIsDaylight(!isDaylight)}
            quality={quality}
            onQualityChange={setQuality}
          />
        )}
      </main>
    </div>
  );
};

export default App;
