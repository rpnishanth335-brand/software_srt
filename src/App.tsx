import React, { useState } from 'react';
import { SvgFilters } from './theme/SvgFilters';
import { AppShell } from './layouts/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DesignShowcase } from './app/DesignShowcase';
import { useHeatHaze } from './components/useHeatHaze';
import { QualityMode } from './theme/tokens';
import { EmberCanvas } from './components/EmberCanvas';
import { AuthProvider, useAuth } from './auth/useAuth';
import { ChronoForgeLogo } from './components/ChronoForgeLogo';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'app' | 'design'>('app');
  const [quality, setQuality] = useState<QualityMode>('high');
  const [isDaylight, setIsDaylight] = useState<boolean>(false);

  // Activate subtle thermal heat haze animation on SVG filter
  useHeatHaze({
    enabled: quality === 'high' && !isDaylight,
    speed: 0.0004,
  });

  // Global Auth Loading Spinner
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#07050d] text-white p-4 space-y-4">
        <ChronoForgeLogo size="lg" animated />
        <div className="flex items-center gap-2 text-xs font-mono-code text-amber-300">
          <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Synthesizing session...</span>
        </div>
      </div>
    );
  }

  // Protected Route: Unauthenticated users are directed to Login Page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className={`min-h-[100dvh] transition-colors duration-500 ${isDaylight ? 'bg-slate-100 text-slate-900' : 'bg-obsidian-950 text-slate-100'}`}>
      {/* Global SVG Filters for liquid glass refraction & gooey drops */}
      <SvgFilters />

      {/* Background Molten Embers (pointer-events-none so it never blocks clicks) */}
      <EmberCanvas maxParticles={quality === 'high' ? 25 : quality === 'medium' ? 12 : 0} className="fixed inset-0 pointer-events-none z-0" />

      {/* Main View Area */}
      <main className="relative z-10 min-h-[100dvh]">
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
