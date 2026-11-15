import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Wand2, 
  CheckSquare, 
  Square, 
  HelpCircle
} from 'lucide-react';

export const Step2Classes: React.FC = () => {
  const { 
    project, 
    addClass, 
    updateClass, 
    deleteClass, 
    toggleSelectClass, 
    selectAllClasses, 
    quickGenerateClasses 
  } = useTimetableStore();

  const { classes } = project;

  // Quick generator form state
  const [showQuickGen, setShowQuickGen] = useState<boolean>(false);
  const [startGrade, setStartGrade] = useState<number>(6);
  const [endGrade, setEndGrade] = useState<number>(10);
  const [sectionsInput, setSectionsInput] = useState<string>('A, B');

  // Manual add state
  const [newName, setNewName] = useState<string>('');
  const [newSection, setNewSection] = useState<string>('A');
  const [newRoom, setNewRoom] = useState<string>('');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addClass({
      name: newName.trim(),
      section: newSection.trim().toUpperCase(),
      selected: true,
      room: newRoom.trim() || undefined,
    });
    setNewName('');
    setNewRoom('');
  };

  const handleQuickGenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sections = sectionsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    quickGenerateClasses(startGrade, endGrade, sections);
    setShowQuickGen(false);
  };

  const allSelected = classes.length > 0 && classes.every((c) => c.selected);
  const selectedCount = classes.filter((c) => c.selected).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> The solver generates conflict-free schedules specifically for selected classes. Classes can be temporarily unselected if you wish to run a phased timetable generation (e.g., senior grades first).
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Classes &amp; Sections ({selectedCount}/{classes.length} Selected)
            </h2>
            <p className="text-xs text-slate-400">Manage cohort sections and designated homerooms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => selectAllClasses(!allSelected)}
            leftIcon={allSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setShowQuickGen(!showQuickGen)}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Quick Generator
          </MoltenButton>
        </div>
      </div>

      {/* Quick Generator Modal / Slide-down */}
      {showQuickGen && (
        <PlasmaGlass glow className="p-6 border-ember-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-ember-400" />
              Batch Class Generator
            </h3>
            <button
              onClick={() => setShowQuickGen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleQuickGenSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Grade</label>
              <input
                type="number"
                min={1}
                max={12}
                value={startGrade}
                onChange={(e) => setStartGrade(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Grade</label>
              <input
                type="number"
                min={startGrade}
                max={12}
                value={endGrade}
                onChange={(e) => setEndGrade(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sections (comma separated)</label>
              <input
                type="text"
                value={sectionsInput}
                onChange={(e) => setSectionsInput(e.target.value)}
                placeholder="A, B, C"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
            <MoltenButton type="submit" size="md" variant="molten">
              Generate Classes
            </MoltenButton>
          </form>
        </PlasmaGlass>
      )}

      {/* Manual Class Addition Bar */}
      <PlasmaGlass className="p-4 sm:p-6">
        <form onSubmit={handleManualAdd} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Class Name (e.g. Grade 10)"
            className="flex-1 w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
          <input
            type="text"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Section (e.g. A)"
            className="w-full sm:w-28 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase"
          />
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Room (e.g. Room 401)"
            className="w-full sm:w-36 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
          <MoltenButton type="submit" size="md" variant="glass" leftIcon={<Plus className="w-4 h-4" />}>
            Add Class
          </MoltenButton>
        </form>
      </PlasmaGlass>

      {/* Class Multi-Select Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => (
          <PlasmaGlass
            key={cls.id}
            hoverEffect
            className={`p-4 transition-all border ${
              cls.selected
                ? 'border-ember-500/40 bg-[#161224]/80 shadow-ember-glow'
                : 'border-white/5 opacity-60 bg-[#0d0c14]/40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSelectClass(cls.id)}
                className="flex items-center gap-2.5 text-left group"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    cls.selected
                      ? 'bg-ember-500 border-amber-300 text-white shadow-sm'
                      : 'border-white/30 bg-black/40 group-hover:border-ember-400'
                  }`}
                >
                  {cls.selected && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-200">
                    {cls.name} – {cls.section}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-code">
                    {cls.room || 'No Room Assigned'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => deleteClass(cls.id)}
                className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Delete Class"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
              <input
                type="text"
                value={cls.room || ''}
                placeholder="Assign Room"
                onChange={(e) => updateClass(cls.id, { room: e.target.value })}
                className="bg-transparent border-b border-white/10 text-slate-300 text-[11px] focus:outline-none focus:border-ember-400 w-24"
              />
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                cls.selected ? 'bg-ember-500/20 text-ember-300' : 'bg-white/5 text-slate-500'
              }`}>
                {cls.selected ? 'Active' : 'Excluded'}
              </span>
            </div>
          </PlasmaGlass>
        ))}
      </div>
    </div>
  );
};
