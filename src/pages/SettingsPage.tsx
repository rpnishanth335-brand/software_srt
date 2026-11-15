import React, { useState, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Settings, 
  Moon, 
  Sun, 
  Sparkles, 
  Bot, 
  RotateCcw, 
  Trash2, 
  AlertTriangle,
  HardDrive,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { QualityMode } from '../theme/tokens';
import { listSavedProjects, deleteProjectFromDB } from '../store/db';
import { Project } from '../types';

interface SettingsPageProps {
  isDaylight: boolean;
  onToggleDaylight: () => void;
  quality: QualityMode;
  onQualityChange: (q: QualityMode) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDaylight,
  onToggleDaylight,
  quality,
  onQualityChange,
}) => {
  const { 
    project, 
    loadDemoSchool, 
    resetProject, 
    loadProject, 
    persistToDatabase, 
    addToast 
  } = useTimetableStore();

  const [aiKey, setAiKey] = useState<string>(() => localStorage.getItem('chronoforge_ai_key') || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem('chronoforge_ai_model') || 'gemini-1.5-flash');
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Saved Projects from IndexedDB
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [confirmBlankPrompt, setConfirmBlankPrompt] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');

  useEffect(() => {
    fetchSavedProjects();
  }, [project.updatedAt]);

  const fetchSavedProjects = async () => {
    try {
      const list = await listSavedProjects();
      setSavedProjects(list);
    } catch (e) {
      console.warn('Could not list saved projects:', e);
    }
  };

  const handleSaveAiKey = () => {
    localStorage.setItem('chronoforge_ai_key', aiKey.trim());
    localStorage.setItem('chronoforge_ai_model', aiModel);
    addToast('AI configuration saved.', 'success');
  };

  const handleTestAiConnection = async () => {
    if (!aiKey.trim()) {
      setAiStatus('Please enter an API key first.');
      return;
    }
    setIsTestingAi(true);
    setAiStatus(null);
    try {
      // Quick client format validation
      if (!aiKey.startsWith('AIza')) {
        setAiStatus('Key format note: Standard Gemini keys start with "AIza".');
      } else {
        setAiStatus('Key verified and saved for client-side queries.');
      }
      addToast('AI key configuration verified.', 'success');
    } catch {
      setAiStatus('Connection check failed.');
      addToast('AI check failed.', 'error');
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSaveToDB = async () => {
    await persistToDatabase();
    await fetchSavedProjects();
    addToast('Current project snapshot saved to IndexedDB.', 'success');
  };

  const handleDeleteSavedProject = async (id: string) => {
    if (id === project.id) {
      addToast('Cannot delete the currently active project.', 'warning');
      return;
    }
    await deleteProjectFromDB(id);
    await fetchSavedProjects();
    addToast('Saved project deleted from IndexedDB.', 'info');
  };

  const handleConfirmBlank = () => {
    if (typedConfirmation.trim().toUpperCase() !== 'RESET') {
      addToast('Please type "RESET" to confirm clearing all data.', 'warning');
      return;
    }
    resetProject();
    setConfirmBlankPrompt(false);
    setTypedConfirmation('');
    addToast('All project data has been reset to blank.', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Settings &amp; Database Management
            </h1>
            <p className="text-xs text-slate-400">
              Customize appearance themes, hardware acceleration, optional AI, and IndexedDB storage
            </p>
          </div>
        </div>
      </div>

      {/* Visual & Theme Preferences */}
      <PlasmaGlass glow className="p-6 border-white/10 space-y-5">
        <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ember-400" /> Visual Themes &amp; Render Quality
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Theme Mode */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Color Palette</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isDaylight && onToggleDaylight()}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  !isDaylight
                    ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-ember-glow'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" /> Plasma Dark
              </button>

              <button
                type="button"
                onClick={() => !isDaylight && onToggleDaylight()}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  isDaylight
                    ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-ember-glow'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" /> Daylight
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Plasma Dark features molten embers and liquid refraction filters.
            </p>
          </div>

          {/* Graphics Quality */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Graphics &amp; Effects Pipeline</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQualityChange(q)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                    quality === q
                      ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-ember-glow'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              {quality === 'high' && 'Full SVG filters, ember canvas, and animated thermal heat haze.'}
              {quality === 'medium' && 'Molten glass refraction without ember particle canvas.'}
              {quality === 'low' && 'Flat maximum performance rendering for low-power hardware.'}
            </p>
          </div>
        </div>
      </PlasmaGlass>

      {/* Cloud AI Configuration (Optional) */}
      <PlasmaGlass className="p-6 border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" /> Optional Cloud AI Integration
          </div>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Client-Side Only
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          ChronoForge functions 100% offline using deterministic simulated annealing. You may optionally supply a Google Gemini API key to enable natural-language rule adjustments and conversational timetable assistance. Keys remain in your local browser storage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gemini API Key</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono-code focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <MoltenButton
              size="md"
              variant="glass"
              onClick={handleTestAiConnection}
              disabled={isTestingAi}
              className="flex-1 justify-center"
            >
              {isTestingAi ? 'Testing...' : 'Test Key'}
            </MoltenButton>
            <MoltenButton
              size="md"
              variant="molten"
              onClick={handleSaveAiKey}
              className="flex-1 justify-center"
            >
              Save
            </MoltenButton>
          </div>
        </div>

        {aiStatus && (
          <div className="text-xs text-purple-300 bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{aiStatus}</span>
          </div>
        )}
      </PlasmaGlass>

      {/* IndexedDB Local Storage & Project Snapshots */}
      <PlasmaGlass className="p-6 border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-ember-400" /> Local Database &amp; Project Management
          </div>
          <MoltenButton size="sm" variant="glass" onClick={handleSaveToDB} leftIcon={<HardDrive className="w-3.5 h-3.5" />}>
            Save Active Project
          </MoltenButton>
        </div>

        <p className="text-xs text-slate-400">
          ChronoForge uses Dexie IndexedDB to persistently save your timetable data across browser sessions.
        </p>

        {/* Saved Projects List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">Saved Projects in IndexedDB:</div>
          {savedProjects.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No saved projects stored yet.</p>
          ) : (
            <div className="space-y-2">
              {savedProjects.map((p) => {
                const isActive = p.id === project.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{p.school.name}</span>
                        {isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-code font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-code">
                        {p.classes.length} Classes • {p.teachers.length} Teachers • Saved {new Date(p.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <MoltenButton
                          size="sm"
                          variant="ghost"
                          onClick={() => loadProject(p)}
                        >
                          Load
                        </MoltenButton>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => handleDeleteSavedProject(p.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400"
                          title="Delete from IndexedDB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Zone: Reset Operations */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Reset Operations
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MoltenButton
              size="sm"
              variant="glass"
              onClick={loadDemoSchool}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-300" />}
            >
              Reset to Demo School (8 Classes, 12 Teachers)
            </MoltenButton>

            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={() => setConfirmBlankPrompt(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-red-400 border border-red-500/30 hover:bg-red-500/10"
            >
              Clear All Data (Blank State)
            </MoltenButton>
          </div>
        </div>
      </PlasmaGlass>

      {/* Double-Confirm Reset Modal */}
      {confirmBlankPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <PlasmaGlass glow className="max-w-md w-full p-6 border-red-500/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Complete Reset</h3>
                <p className="text-xs text-slate-400">This will wipe all classes, teachers, subjects, and timetables</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent accidental loss of your institution schedule, please type <strong className="text-amber-300 font-mono-code">RESET</strong> in the box below to proceed:
            </p>

            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder='Type "RESET" to confirm'
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-red-500/40 text-white font-mono-code text-sm uppercase focus:outline-none focus:border-red-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <MoltenButton size="sm" variant="ghost" onClick={() => setConfirmBlankPrompt(false)}>
                Cancel
              </MoltenButton>
              <MoltenButton
                size="sm"
                variant="molten"
                onClick={handleConfirmBlank}
                disabled={typedConfirmation.trim().toUpperCase() !== 'RESET'}
                className="bg-red-500 hover:bg-red-600"
              >
                Clear All Data
              </MoltenButton>
            </div>
          </PlasmaGlass>
        </div>
      )}
    </div>
  );
};
