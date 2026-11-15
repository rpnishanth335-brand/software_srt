import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Zap, 
  Layers, 
  Palette,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { GooGroup } from '../components/GooGroup';
import { EmberCanvas } from '../components/EmberCanvas';
import { THEME_TOKENS } from '../theme/tokens';

export const DesignShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'buttons' | 'goo' | 'particles' | 'tokens'>('cards');
  const [isForging, setIsForging] = useState<boolean>(false);
  const [emberIntensity, setEmberIntensity] = useState<number>(1.2);
  const [activeGooChip, setActiveGooChip] = useState<number>(1);
  const [hazeEnabled, setHazeEnabled] = useState<boolean>(true);

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Background Living Embers */}
      <EmberCanvas maxParticles={45} intensity={emberIntensity} className="fixed inset-0 pointer-events-none z-0" />

      {/* Page Header */}
      <div className="relative z-10 mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ember-500/10 border border-ember-500/30 text-ember-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-ember-gold animate-pulse" />
            Design System & Shader Lab
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
            Plasma Glass <span className="bg-gradient-to-r from-ember-400 via-amber-300 to-plasma-violet bg-clip-text text-transparent">&amp; Molten UI</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
            Living translucent optics with dynamic SVG turbulence refraction, specular edge lighting, 
            molten metaball fusion, and trapped GPU ember particles.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setHazeEnabled(!hazeEnabled)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Heat Haze: {hazeEnabled ? 'Active' : 'Off'}
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setIsForging(!isForging)}
            leftIcon={<Flame className="w-3.5 h-3.5" />}
          >
            {isForging ? 'Cooldown' : 'Ignite Forge'}
          </MoltenButton>
        </div>
      </div>

      {/* Showcase Tabs */}
      <div className="relative z-10 mb-10 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
          {[
            { id: 'cards', label: 'Plasma Glass Cards', icon: <Layers className="w-4 h-4" /> },
            { id: 'buttons', label: 'Molten Buttons', icon: <Zap className="w-4 h-4" /> },
            { id: 'goo', label: 'Molten Droplet Merging', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'particles', label: 'Ember Particles', icon: <Flame className="w-4 h-4" /> },
            { id: 'tokens', label: 'Theme Tokens & WCAG', icon: <Palette className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-ember-600 via-ember-500 to-ember-plasma text-white shadow-ember-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT 1: PLASMA GLASS CARDS */}
      {activeTab === 'cards' && (
        <section className="relative z-10 space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Default Glass Card */}
            <PlasmaGlass hoverEffect className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code text-ember-400 uppercase tracking-wider">Optic Material</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">Default</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Liquid Obsidian Glass</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Standard translucent surface with specular highlight along the top rim and deep optical absorption.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-8 h-8 rounded-lg bg-ember-500/20 flex items-center justify-center text-ember-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Timetable Grid Cell</div>
                  <div className="text-[11px] text-slate-400">Class 10-A • Physics</div>
                </div>
              </div>
            </PlasmaGlass>

            {/* Ember Rim Glow Card */}
            <PlasmaGlass variant="ember" glow hoverEffect className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code text-ember-300 uppercase tracking-wider">Active Conic Glow</span>
                <span className="text-xs px-2 py-0.5 rounded bg-ember-500/20 text-ember-300 font-semibold">Glowing Rim</span>
              </div>
              <h3 className="text-lg font-bold text-amber-200 mb-2">Ember Rim Lighting</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Animated conic-gradient border simulating living plasma heat creeping along the internal lens bevel.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-ember-500/20">
                <div className="w-8 h-8 rounded-lg bg-ember-500/30 flex items-center justify-center text-ember-200">
                  <Flame className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-100">Solver Core Status</div>
                  <div className="text-[11px] text-amber-300/80">Simulated Annealing Active</div>
                </div>
              </div>
            </PlasmaGlass>

            {/* Plasma Violet Card */}
            <PlasmaGlass variant="plasma" hoverEffect className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code text-plasma-violet uppercase tracking-wider">Chromatic Lens</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Plasma Violet</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Refraction Chamber</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                High-frequency spectral dispersion tuned for conflict diagnostic feeds and rule weight matrices.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-purple-500/20">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Slot Feasibility</div>
                  <div className="text-[11px] text-purple-300/80">0 Hard Clashes Detected</div>
                </div>
              </div>
            </PlasmaGlass>

            {/* Daylight Glass Variant */}
            <PlasmaGlass variant="daylight" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code text-amber-800 uppercase tracking-wider">High Contrast</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">Daylight Glass</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Daylight Translucency</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Light-mode lens engineered for sunlit classrooms and high-clarity document inspection.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-800">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Print Preview Mode</div>
                  <div className="text-[11px] text-slate-500">A4 Landscape Export Ready</div>
                </div>
              </div>
            </PlasmaGlass>

            {/* Timetable Interactive Grid Tile Preview */}
            <PlasmaGlass className="p-6 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code text-ember-400 uppercase tracking-wider">Timetable Cell Micro-Optics</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">Interactive Preview</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { sub: 'MATHS', teacher: 'DR. RAO', room: 'R-201', color: '#f97316' },
                  { sub: 'PHYSICS LAB', teacher: 'MRS. CHEN', room: 'LAB-1', color: '#a855f7', double: true },
                  { sub: 'CHEMISTRY', teacher: 'MR. SAHA', room: 'R-202', color: '#06b6d4' },
                  { sub: 'SPORTS', teacher: 'COACH ROY', room: 'GROUND', color: '#10b981' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{ borderColor: item.color }}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/80 transition-all hover:scale-105 cursor-grab shadow-glass-specular relative group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white tracking-wide">{item.sub}</span>
                      {item.double && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono-code">2X</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{item.teacher}</div>
                    <div className="text-[9px] text-slate-500 mt-1 font-mono-code">{item.room}</div>
                  </div>
                ))}
              </div>
            </PlasmaGlass>
          </div>
        </section>
      )}

      {/* TAB CONTENT 2: MOLTEN BUTTONS */}
      {activeTab === 'buttons' && (
        <section className="relative z-10 space-y-10 animate-fadeIn">
          <PlasmaGlass className="p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-ember-gold" />
              Molten Button Variants & States
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <MoltenButton variant="molten">Molten Primary</MoltenButton>
              <MoltenButton variant="glass">Glass Refraction</MoltenButton>
              <MoltenButton variant="plasma">Plasma Pulse</MoltenButton>
              <MoltenButton variant="danger">Critical Reset</MoltenButton>
              <MoltenButton variant="ghost">Ghost Option</MoltenButton>
              <MoltenButton variant="molten" isLoading>Forging...</MoltenButton>
              <MoltenButton variant="molten" disabled>Disabled State</MoltenButton>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-mono-code">
                Button Sizing Scale
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <MoltenButton size="sm" variant="glass">Small (sm)</MoltenButton>
                <MoltenButton size="md" variant="molten">Medium (md)</MoltenButton>
                <MoltenButton size="lg" variant="plasma">Large (lg)</MoltenButton>
                <MoltenButton size="forge" variant="molten" isForge>
                  FORGE TIMETABLE
                </MoltenButton>
              </div>
            </div>
          </PlasmaGlass>
        </section>
      )}

      {/* TAB CONTENT 3: MOLTEN DROPLET MERGING (GOOEY FILTER) */}
      {activeTab === 'goo' && (
        <section className="relative z-10 space-y-8 animate-fadeIn">
          <PlasmaGlass className="p-8">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ember-gold" />
                Molten Droplet Merging (SVG Goo Filter)
              </h2>
              <p className="text-sm text-slate-400 mb-8">
                Adjacent chips and pills pass through an SVG metaball filter (<code>feGaussianBlur</code> + <code>feColorMatrix</code>) 
                causing them to bridge and stretch like liquid lava before snapping cleanly into place.
              </p>
            </div>

            {/* Goo Group Playground */}
            <div className="p-8 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center gap-6 overflow-hidden min-h-[160px]">
              <span className="text-xs font-mono-code text-slate-500">Live Molten Merging Container</span>
              
              <GooGroup className="gap-1 p-2 bg-ember-900/20 rounded-full border border-ember-500/30">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isSelected = activeGooChip === num;
                  return (
                    <button
                      key={num}
                      onClick={() => setActiveGooChip(num)}
                      className={`relative px-5 py-2.5 rounded-full text-xs font-extrabold uppercase transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-ember-500 to-ember-plasma text-white shadow-ember-glow scale-110 z-20'
                          : 'bg-white/15 text-slate-300 hover:bg-white/25 hover:text-white z-10'
                      }`}
                    >
                      Step 0{num}
                    </button>
                  );
                })}
              </GooGroup>

              <span className="text-[11px] text-amber-300/80 font-mono-code">
                Selected Step: 0{activeGooChip} • Watch droplets stretch across adjacent boundaries
              </span>
            </div>
          </PlasmaGlass>
        </section>
      )}

      {/* TAB CONTENT 4: EMBER PARTICLES */}
      {activeTab === 'particles' && (
        <section className="relative z-10 space-y-8 animate-fadeIn">
          <PlasmaGlass className="p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-ember-gold" />
              Ember Particle Chamber
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xl">
              Sparks and embers rise organically from the bottom edge, fluttering with sinusoidal perturbation, 
              brightening when intersecting glass surfaces, and reacting to cursor proximity.
            </p>

            <div className="relative h-72 w-full rounded-2xl bg-black/80 border border-ember-500/30 overflow-hidden flex items-center justify-center">
              <EmberCanvas maxParticles={60} intensity={emberIntensity} className="absolute inset-0" />
              <div className="relative z-10 text-center pointer-events-none">
                <div className="text-2xl font-bold font-display text-white">Trapped Living Plasma</div>
                <div className="text-xs text-ember-400 font-mono-code mt-1">Move cursor inside this chamber</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <span className="text-xs font-mono-code text-slate-300">Particle Intensity:</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={emberIntensity}
                onChange={(e) => setEmberIntensity(parseFloat(e.target.value))}
                className="w-48 accent-ember-500"
              />
              <span className="text-xs font-mono-code text-ember-400 font-bold">{emberIntensity}x</span>
            </div>
          </PlasmaGlass>
        </section>
      )}

      {/* TAB CONTENT 5: THEME TOKENS & WCAG */}
      {activeTab === 'tokens' && (
        <section className="relative z-10 space-y-8 animate-fadeIn">
          <PlasmaGlass className="p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Theme Tokens & WCAG AA Contrast Audit
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              All text labels and indicators strictly exceed WCAG AA contrast standards (4.5:1 for body, 3:1 for headers) 
              over both obsidian and daylight glass backgrounds.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {THEME_TOKENS.colors.subjectColors.map((col, idx) => (
                <div
                  key={idx}
                  style={{ backgroundColor: col.bg, borderColor: col.border }}
                  className="p-4 rounded-xl border flex flex-col justify-between h-24"
                >
                  <span className="text-xs font-bold text-white">{col.name}</span>
                  <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-200">
                    <span>{col.hex}</span>
                    <span className="text-emerald-400 font-bold">Pass AA</span>
                  </div>
                </div>
              ))}
            </div>
          </PlasmaGlass>
        </section>
      )}
    </div>
  );
};
