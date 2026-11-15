import React from 'react';
import { Flame, Sparkles, Sliders, Moon, Sun, Layers } from 'lucide-react';
import { QualityMode } from '../theme/tokens';

interface NavbarProps {
  currentView: 'wizard' | 'design';
  onViewChange: (view: 'wizard' | 'design') => void;
  quality: QualityMode;
  onQualityChange: (quality: QualityMode) => void;
  isDaylight: boolean;
  onToggleDaylight: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  quality,
  onQualityChange,
  isDaylight,
  onToggleDaylight,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 border-b border-white/10 bg-[#07060a]/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onViewChange('wizard')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-ember-500 to-ember-plasma p-0.5 shadow-ember-glow group-hover:shadow-ember-glow-lg transition-all duration-300">
            <div className="w-full h-full bg-[#0b0a10] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-ember-gold group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-wider bg-gradient-to-r from-amber-200 via-ember-400 to-ember-plasma bg-clip-text text-transparent">
                CHRONOFORGE
              </span>
              <span className="text-[10px] font-mono-code uppercase px-1.5 py-0.5 rounded bg-ember-500/20 text-ember-300 border border-ember-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">AI School Timetable Generator</p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => onViewChange('wizard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'wizard'
                  ? 'bg-gradient-to-r from-ember-600 to-ember-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Timetable Wizard
              </span>
            </button>
            <button
              onClick={() => onViewChange('design')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'design'
                  ? 'bg-gradient-to-r from-ember-600 to-ember-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                /design System
              </span>
            </button>
          </div>

          {/* Quality Mode Selector */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-ember-400 mr-1" />
            <span className="text-[11px] text-slate-400">Quality:</span>
            {(['high', 'medium', 'low'] as QualityMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onQualityChange(mode)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-all ${
                  quality === mode
                    ? 'bg-ember-500/30 text-ember-300 border border-ember-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Daylight Glass Toggle */}
          <button
            onClick={onToggleDaylight}
            title={isDaylight ? "Switch to Obsidian Plasma" : "Switch to Daylight Glass"}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-400/40 transition-all"
          >
            {isDaylight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
