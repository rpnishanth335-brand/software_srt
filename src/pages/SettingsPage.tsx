import React, { useState, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { useAuth } from '../auth/useAuth';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { Modal } from '../components/ui/Modal';
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
  ShieldCheck,
  Eye,
  EyeOff,
  ClipboardPaste,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { QualityMode } from '../theme/tokens';
import { listSavedProjects, deleteProjectFromDB } from '../store/db';
import { Project, AppRoute } from '../types';
import { saveAiKey, getAiKey, removeAiKey } from '../services/aiKeyStorage';
import { testGeminiConnection, AiConnectionStatus } from '../services/geminiClient';

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
    resetProject, 
    loadProject, 
    persistToDatabase, 
    addToast,
    setCurrentRoute
  } = useTimetableStore();
  const { user } = useAuth();

  // AI Configuration State
  const [aiKey, setAiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [aiModel, setAiModel] = useState<string>(() => {
    const saved = localStorage.getItem('chronoforge_ai_model');
    const VALID_MODELS = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    if (!saved || !VALID_MODELS.includes(saved)) {
      return 'gemini-2.0-flash';
    }
    return saved;
  });
  const [aiTemperature, setAiTemperature] = useState<number>(() => {
    const saved = localStorage.getItem('chronoforge_ai_temp');
    return saved !== null ? parseFloat(saved) : 0.1;
  });
  const [useAiForGeneration, setUseAiForGeneration] = useState<boolean>(() => {
    return localStorage.getItem('chronoforge_use_ai_gen') !== 'false';
  });
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    return localStorage.getItem('chronoforge_use_proxy') === 'true';
  });

  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiConnectionStatus>('unconfigured');
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [returnRoute, setReturnRoute] = useState<string | null>(null);

  // Saved Projects from IndexedDB
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [confirmBlankPrompt, setConfirmBlankPrompt] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');

  // Check for return route from banner
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('chronoforge_return_route');
      if (stored) {
        setReturnRoute(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load encrypted key on mount or user change
  useEffect(() => {
    const loadKey = async () => {
      const uid = user?.uid || 'default_user';
      const savedKey = await getAiKey(uid);
      if (savedKey) {
        setAiKey(savedKey);
        setAiStatus('connected');
        setAiStatusMessage('Key configured and encrypted in IndexedDB.');
      } else {
        setAiKey('');
        setAiStatus('unconfigured');
        setAiStatusMessage('No API key configured.');
      }
    };
    loadKey();
  }, [user?.uid]);

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

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAiKey(text.trim());
        addToast('Pasted API key from clipboard.', 'info');
      }
    } catch (err) {
      addToast('Clipboard access was blocked by your browser.', 'warning');
    }
  };

  const handleSaveAiKey = async () => {
    const uid = user?.uid || 'default_user';
    try {
      await saveAiKey(uid, aiKey);
      localStorage.setItem('chronoforge_ai_model', aiModel);
      localStorage.setItem('chronoforge_ai_temp', aiTemperature.toString());
      localStorage.setItem('chronoforge_use_ai_gen', useAiForGeneration.toString());
      localStorage.setItem('chronoforge_use_proxy', useProxy.toString());

      if (aiKey.trim()) {
        setAiStatus('connected');
        setAiStatusMessage('Key encrypted and saved securely for this account.');
        addToast('Gemini AI configuration saved successfully.', 'success');
      } else {
        setAiStatus('unconfigured');
        setAiStatusMessage('API key removed.');
        addToast('AI key cleared.', 'info');
      }
    } catch (err) {
      console.error('Failed to save AI key:', err);
      addToast('Could not save encrypted key to IndexedDB.', 'error');
    }
  };

  const handleTestAiConnection = async () => {
    if (!aiKey.trim()) {
      setAiStatus('unconfigured');
      setAiStatusMessage('Please enter an API key first.');
      return;
    }

    setIsTestingAi(true);
    setAiStatusMessage('Connecting to Gemini API...');
    try {
      const result = await testGeminiConnection(aiKey, aiModel, useProxy);
      setAiStatus(result.status);
      setAiStatusMessage(result.message);

      if (result.status === 'connected') {
        addToast(result.message || 'Gemini API connection successful!', 'success');
        // Automatically save on verified test
        const uid = user?.uid || 'default_user';
        await saveAiKey(uid, aiKey);
      } else if (result.status === 'invalid') {
        addToast(result.message || 'Gemini API key is invalid or unauthorized.', 'error');
      } else if (result.status === 'ratelimited') {
        addToast(result.message || 'Gemini API quota exceeded (429).', 'warning');
      } else {
        addToast(result.message || 'Gemini test connection failed.', 'error');
      }
    } catch (err: any) {
      setAiStatus('error');
      setAiStatusMessage(err?.message || 'Connection test failed.');
      addToast('Connection test failed.', 'error');
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleRemoveAiKey = async () => {
    const uid = user?.uid || 'default_user';
    await removeAiKey(uid);
    setAiKey('');
    setAiStatus('unconfigured');
    setAiStatusMessage('API key has been removed from secure storage.');
    addToast('Gemini API key removed.', 'info');
  };

  const handleReturnToPrevious = () => {
    if (returnRoute) {
      try {
        sessionStorage.removeItem('chronoforge_return_route');
      } catch {}
      setCurrentRoute(returnRoute as AppRoute);
    }
  };

  const handleSaveToDB = async () => {
    await persistToDatabase();
    await fetchSavedProjects();
    addToast('Current project snapshot saved to IndexedDB.', 'success');
  };

  const handleConfirmBlank = () => {
    if (typedConfirmation.trim().toUpperCase() === 'RESET') {
      resetProject();
      setConfirmBlankPrompt(false);
      setTypedConfirmation('');
      addToast('Project data has been cleared completely.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              System Settings &amp; Preferences
            </h1>
            <p className="text-xs text-slate-400">
              Configure AI assistant parameters, encryption storage, visual theme, and database backups
            </p>
          </div>
        </div>

        {returnRoute && (
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={handleReturnToPrevious}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to {returnRoute === 'generate' ? 'Generator' : returnRoute === 'feasibility' ? 'Feasibility' : 'Previous Page'}
          </MoltenButton>
        )}
      </div>

      {/* ================================================================= */}
      {/* 1. AI ASSISTANT & GEMINI CONFIGURATION (SECTION 2 REQUIREMENTS)  */}
      {/* ================================================================= */}
      <PlasmaGlass glow className="p-6 border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-ember-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Gemini AI Assistant &amp; Timetable Generation
              </h3>
              <p className="text-xs text-slate-400">
                Encrypted in IndexedDB per Google User via Web Crypto API (AES-GCM)
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {aiStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
              </span>
            )}
            {aiStatus === 'invalid' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                <XCircle className="w-3.5 h-3.5 text-red-400" /> Invalid Key
              </span>
            )}
            {aiStatus === 'ratelimited' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Rate Limited
              </span>
            )}
            {aiStatus === 'unconfigured' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
                Not configured
              </span>
            )}
            {aiStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                Connection Error
              </span>
            )}
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Google Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
            >
              Get a free key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder="Paste Gemini API key (AQ... or AIzaSy...)"
              className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono-code focus:outline-none focus:border-amber-400"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handlePasteKey}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Model, Temperature & Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Target Gemini Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 font-mono-code"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended, Fast &amp; Balanced)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Always Latest Flash)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Standard Lightweight)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Complex Reasoning)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Sampling Temperature:</span>
              <span className="font-mono-code text-amber-300 font-bold">{aiTemperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={aiTemperature}
              onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Low temperature (0.05 - 0.2) is optimal for strict constraint satisfaction.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={useAiForGeneration}
              onChange={(e) => setUseAiForGeneration(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0 accent-amber-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Enable AI in Timetable Generator</div>
              <div className="text-[11px] text-slate-400">Uses Gemini to suggest schedules before local validator repair</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0 accent-amber-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Route through Serverless (/api/gemini)</div>
              <div className="text-[11px] text-slate-400">Protects API key from browser network tab inspection</div>
            </div>
          </label>
        </div>

        {/* Action Buttons & Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={handleSaveAiKey}
              className="bg-purple-600 hover:bg-purple-500 border-purple-500/40"
            >
              Save Configuration
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="glass"
              onClick={handleTestAiConnection}
              disabled={isTestingAi || !aiKey.trim()}
            >
              {isTestingAi ? 'Testing...' : 'Test Connection'}
            </MoltenButton>
          </div>

          {aiKey.trim() && (
            <button
              onClick={handleRemoveAiKey}
              className="text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1"
            >
              Remove Stored Key
            </button>
          )}
        </div>

        {aiStatusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
            aiStatus === 'connected' 
              ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-200' 
              : aiStatus === 'invalid' || aiStatus === 'error'
              ? 'bg-red-950/30 border border-red-500/30 text-red-200'
              : 'bg-white/5 border border-white/10 text-slate-300'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{aiStatusMessage}</span>
          </div>
        )}

        {/* Privacy Note */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs text-slate-400">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Privacy &amp; Data Minimization Notice:
          </div>
          <p>
            When utilizing Gemini AI, ChronoForge transmits ONLY compact, anonymized schedule requirements: class names (e.g. "Grade 10A"), subject codes (e.g. "MATH"), teacher initials/codes, period counts, and constraint rules.
          </p>
          <p className="text-slate-500">
            Student records, personal emails, phone numbers, profile photos, and Google account credentials are NEVER sent to any external server or model.
          </p>
        </div>
      </PlasmaGlass>

      {/* ================================================================= */}
      {/* 2. THEME & VISUAL QUALITY PREFERENCES                             */}
      {/* ================================================================= */}
      <PlasmaGlass className="p-6 border-white/10 space-y-4">
        <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ember-400" /> Visual Theme &amp; Particle Render Quality
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-semibold text-white">Color Mode</div>
              <div className="text-[11px] text-slate-400">Obsidian Dark vs Daylight High-Contrast</div>
            </div>
            <button
              onClick={onToggleDaylight}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200"
            >
              {isDaylight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Particle Fidelity</span>
              <span className="text-[11px] font-mono-code text-amber-300 uppercase">{quality}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onQualityChange(q)}
                  className={`py-1 rounded text-[11px] font-bold capitalize transition-colors ${
                    quality === q ? 'bg-amber-500 text-white shadow-ember-glow' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PlasmaGlass>

      {/* ================================================================= */}
      {/* 3. LOCAL DATABASE & PROJECT MANAGEMENT                            */}
      {/* ================================================================= */}
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
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {p.school.name || 'Untitled School'}
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono-code">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.classes.length} Classes • {p.teachers.length} Teachers • {p.subjects.length} Subjects
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <MoltenButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            loadProject(p);
                            addToast(`Loaded "${p.school.name}".`, 'success');
                          }}
                        >
                          Switch
                        </MoltenButton>
                      )}
                      <button
                        onClick={async () => {
                          await deleteProjectFromDB(p.id);
                          await fetchSavedProjects();
                          addToast('Project deleted from IndexedDB.', 'info');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                        title="Delete project snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30">
            <div>
              <div className="text-xs font-semibold text-white">Reset Project to Blank</div>
              <div className="text-[11px] text-slate-400">
                Wipes all classes, staff, subjects, assignments, and generated timetables
              </div>
            </div>
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={() => setConfirmBlankPrompt(true)}
              className="bg-red-500/80 hover:bg-red-500 border-red-500/50"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset All Data
            </MoltenButton>
          </div>
        </div>
      </PlasmaGlass>

      {/* ================================================================= */}
      {/* 4. RESET CONFIRMATION MODAL (PORTAL CENTERED VIA MODAL)          */}
      {/* ================================================================= */}
      <Modal
        isOpen={confirmBlankPrompt}
        onClose={() => setConfirmBlankPrompt(false)}
        maxWidth="md"
        title="Confirm Complete Reset"
        subtitle="This will wipe all classes, teachers, subjects, and timetables"
        icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <MoltenButton size="sm" variant="ghost" onClick={() => setConfirmBlankPrompt(false)}>
              Cancel
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={handleConfirmBlank}
              disabled={typedConfirmation.trim().toUpperCase() !== 'RESET'}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Clear All Data
            </MoltenButton>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          <p className="leading-relaxed">
            To prevent accidental loss of your institution schedule, please type <strong className="text-amber-300 font-mono-code">RESET</strong> in the box below to proceed:
          </p>

          <input
            type="text"
            value={typedConfirmation}
            onChange={(e) => setTypedConfirmation(e.target.value)}
            placeholder='Type "RESET" to confirm'
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-red-500/40 text-white font-mono-code text-sm uppercase focus:outline-none focus:border-red-400"
          />
        </div>
      </Modal>
    </div>
  );
};
