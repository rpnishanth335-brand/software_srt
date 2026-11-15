import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Upload, 
  Sun, 
  Layers, 
  HelpCircle,
  FlaskConical
} from 'lucide-react';
import { Subject } from '../types';
import { THEME_TOKENS } from '../theme/tokens';

export const Step3Subjects: React.FC = () => {
  const { project, addSubject, deleteSubject, importSubjects } = useTimetableStore();
  const { subjects } = project;

  // New subject form state
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [color, setColor] = useState<string>('#f97316');
  const [type, setType] = useState<Subject['type']>('theory');
  const [doublePeriod, setDoublePeriod] = useState<boolean>(false);
  const [preferMorning, setPreferMorning] = useState<boolean>(false);
  const [maxPerDay, setMaxPerDay] = useState<number>(2);
  const [specialRoom, setSpecialRoom] = useState<string>('');

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addSubject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
      type,
      doublePeriod,
      preferMorning,
      maxPerDay,
      specialRoomId: specialRoom.trim() || undefined,
    });

    setName('');
    setCode('');
    setSpecialRoom('');
    setDoublePeriod(false);
    setPreferMorning(false);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const imported: Omit<Subject, 'id'>[] = [];

      // Assume CSV format: Name,Code,Type,Color,DoublePeriod(true/false),PreferMorning(true/false)
      lines.slice(1).forEach((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          imported.push({
            name: parts[0],
            code: parts[1].toUpperCase(),
            type: (parts[2]?.toLowerCase() as Subject['type']) || 'theory',
            color: parts[3] || THEME_TOKENS.colors.subjectColors[imported.length % 8].hex,
            doublePeriod: parts[4]?.toLowerCase() === 'true',
            preferMorning: parts[5]?.toLowerCase() === 'true',
            maxPerDay: 2,
          });
        }
      });

      if (imported.length > 0) {
        importSubjects(imported);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> Subjects are colored tiles on the grid. Flags like Double Period ensure practical labs are placed in consecutive blocks and never fractured across a recess or lunch break.
        </div>
      </div>

      {/* Header and CSV Import */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Subjects Catalog ({subjects.length})</h2>
            <p className="text-xs text-slate-400">Configure curriculum subjects, double-period requirements, and lab spaces</p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-ember-500/50 cursor-pointer transition-all">
          <Upload className="w-3.5 h-3.5 text-ember-400" />
          Import Subjects CSV
          <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
        </label>
      </div>

      {/* Add New Subject Form */}
      <PlasmaGlass className="p-6 space-y-4">
        <h3 className="text-xs font-mono-code text-ember-400 uppercase tracking-wider">
          Add New Subject to Curriculum
        </h3>
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Advanced Biology"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Short Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BIO"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase font-mono-code"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0a10] border border-white/15 text-white text-xs focus:outline-none focus:border-ember-500 capitalize"
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab / Practical</option>
                <option value="sports">Sports</option>
                <option value="activity">Activity / Arts</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Color Tag</label>
              <div className="flex items-center gap-1.5">
                {THEME_TOKENS.colors.subjectColors.map((sc) => (
                  <button
                    key={sc.hex}
                    type="button"
                    onClick={() => setColor(sc.hex)}
                    style={{ backgroundColor: sc.hex }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === sc.hex ? 'ring-2 ring-white scale-125' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px]">Max/Day:</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10) || 1)}
                  className="w-12 px-1.5 py-1 rounded bg-[#0b0a10] border border-white/20 text-center font-mono-code font-bold text-amber-300"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={doublePeriod}
                  onChange={(e) => setDoublePeriod(e.target.checked)}
                  className="rounded border-white/20 accent-ember-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Requires Double Period (2x)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={preferMorning}
                  onChange={(e) => setPreferMorning(e.target.checked)}
                  className="rounded border-white/20 accent-ember-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Prefer Morning Slots
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <MoltenButton type="submit" size="sm" variant="molten" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Subject
              </MoltenButton>
            </div>
          </div>
        </form>
      </PlasmaGlass>

      {/* Subjects Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => (
          <PlasmaGlass
            key={sub.id}
            hoverEffect
            className="p-4 border-l-4"
            style={{ borderLeftColor: sub.color }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{sub.name}</span>
                  <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                    {sub.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                  Type: {sub.type}
                </div>
              </div>

              <button
                onClick={() => deleteSubject(sub.id)}
                className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Delete Subject"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
              {sub.doublePeriod && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Double Period
                </span>
              )}
              {sub.preferMorning && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sun className="w-3 h-3" />
                  Morning Preferred
                </span>
              )}
              {sub.specialRoomId && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" />
                  Special Room
                </span>
              )}
            </div>
          </PlasmaGlass>
        ))}
      </div>
    </div>
  );
};
