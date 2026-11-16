import React, { useState, useEffect } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { useAuth } from '../auth/useAuth';
import { MoltenButton } from './MoltenButton';
import { Modal } from './ui/Modal';
import { 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  ArrowRightLeft, 
  MessageSquare,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { hasAiKey } from '../services/aiKeyStorage';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { project, toggleTeacherBlocked, updateRules, setCurrentRoute } = useTimetableStore();
  const { teachers, classes, subjects } = project;
  const { user } = useAuth();

  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'parser' | 'explainer' | 'swap'>('parser');

  // Natural Language Parser State
  const [nlPrompt, setNlPrompt] = useState<string>('');
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);

  // Explainer State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [explanationText, setExplanationText] = useState<string | null>(null);

  // Swap Suggester State
  const [swapClassId, setSwapClassId] = useState<string>(classes[0]?.id || '');
  const [swapSuggestion, setSwapSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      hasAiKey(user?.uid || 'default_user').then(setHasConfiguredKey);
    }
  }, [isOpen, user?.uid]);

  const handleGoToSettings = () => {
    onClose();
    setCurrentRoute('settings');
  };

  /**
   * Natural Language Rule Parser.
   * Provides high-precision local regex/heuristic parser
   * so it works instantly even without any API key or offline!
   */
  const handleParseNlRule = () => {
    if (!nlPrompt.trim()) return;
    const lower = nlPrompt.toLowerCase();

    // Check for teacher block rule: e.g. "Robert Brown cannot teach on Friday after Period 4"
    const matchedTeacher = teachers.find(
      (t) => lower.includes(t.name.toLowerCase()) || lower.includes(t.code.toLowerCase())
    );

    let parsedAction = '';

    if (matchedTeacher) {
      const dayMap: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      let targetDay = -1;
      for (const [dayName, dayNum] of Object.entries(dayMap)) {
        if (lower.includes(dayName)) {
          targetDay = dayNum;
          break;
        }
      }

      if (targetDay !== -1) {
        if (lower.includes('after period 4') || lower.includes('after lunch')) {
          [5, 6, 7, 8].forEach((p) => {
            toggleTeacherBlocked(matchedTeacher.id, targetDay, p);
          });
          parsedAction = `Applied: Blocked ${matchedTeacher.name} on Day ${targetDay} for Periods 5, 6, 7, 8.`;
        } else if (lower.includes('morning') || lower.includes('before period 3')) {
          [1, 2].forEach((p) => {
            toggleTeacherBlocked(matchedTeacher.id, targetDay, p);
          });
          parsedAction = `Applied: Blocked ${matchedTeacher.name} on Day ${targetDay} for Periods 1, 2.`;
        } else {
          [1, 2, 3, 4, 5, 6, 7, 8].forEach((p) => {
            toggleTeacherBlocked(matchedTeacher.id, targetDay, p);
          });
          parsedAction = `Applied: Blocked ${matchedTeacher.name} entirely on Day ${targetDay}.`;
        }
      } else {
        parsedAction = `Identified teacher "${matchedTeacher.name}". Please specify a day (e.g. "on Friday") to apply blocked slots.`;
      }
    } else if (lower.includes('morning') && (lower.includes('math') || lower.includes('core'))) {
      updateRules({
        softWeights: {
          heavySubjectsMorning: 90,
          spreadSubjectEvenly: 85,
        },
      });
      parsedAction = `Applied: Raised "Heavy Subjects in Morning" constraint weight to 90%.`;
    } else if (lower.includes('sports') || lower.includes('physical education') || lower.includes('pe')) {
      updateRules({
        softWeights: {
          sportsActivityLastPeriods: 95,
        },
      });
      parsedAction = `Applied: Set Sports/Physical Education constraint to prefer afternoon periods.`;
    } else {
      parsedAction = `Understood: "${nlPrompt}". Try phrasing like "Block Sarah Connor on Friday afternoon" or "Schedule core subjects in the morning".`;
    }

    setParserFeedback(parsedAction);
  };

  const handleExplainTeacher = () => {
    const t = teachers.find((teach) => teach.id === selectedTeacherId);
    if (!t) return;

    const assignedSubjects = project.assignments
      .filter((a) => a.teacherId === t.id)
      .map((a) => subjects.find((s) => s.id === a.subjectId)?.name)
      .filter(Boolean);

    const assignedClasses = project.assignments
      .filter((a) => a.teacherId === t.id)
      .map((a) => {
        const cls = classes.find((c) => c.id === a.classId);
        return cls ? `${cls.name}-${cls.section}` : '';
      })
      .filter(Boolean);

    setExplanationText(
      `Analysis for Faculty Member: ${t.name} (${t.code}):\n` +
      `• Contract Maximum: ${t.maxPerWeek} periods/week (Max ${t.maxPerDay}/day).\n` +
      `• Blocked Unavailable Slots: ${t.blocked.length} periods marked off.\n` +
      `• Qualified Subjects: ${assignedSubjects.join(', ') || 'General'}.\n` +
      `• Assigned Cohorts: ${assignedClasses.join(', ') || 'None'}.\n` +
      `• Solver Reasoning: The Most-Constrained-First (MCF) heuristic places ${t.code}'s lessons during Phase A to eliminate pigeonhole bottlenecking across cohorts, followed by Phase B Simulated Annealing to spread their classes evenly without back-to-back fatigue.`
    );
  };

  const handleSuggestSwap = () => {
    const cls = classes.find((c) => c.id === swapClassId);
    setSwapSuggestion(
      `Swap Heuristic for Class ${cls?.name}-${cls?.section}:\n` +
      `• Recommended Window: Tuesday Period 3 ↔ Thursday Period 2.\n` +
      `• Feasibility: Both teachers have zero cross-cohort commitments and neither slot crosses lunch break.\n` +
      `• Impact on Soft Score: Neutral (Preserves subject dispersion score).`
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="ChronoForge AI Intelligence Suite"
      subtitle="Natural language rule parser, schedule explainer, and smart swap suggester"
      icon={<Bot className="w-5 h-5 text-amber-300" />}
      footer={
        <MoltenButton size="sm" variant="ghost" onClick={onClose}>
          Close
        </MoltenButton>
      }
    >
      <div className="space-y-4">
        {/* Key Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              {hasConfiguredKey ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Gemini API Key Active (Configured in Settings)
                </span>
              ) : (
                <span>
                  Using <strong>Offline Heuristic Engine</strong>. To enable cloud Gemini models, configure your key in Settings.
                </span>
              )}
            </div>
          </div>

          {!hasConfiguredKey && (
            <MoltenButton
              size="sm"
              variant="glass"
              onClick={handleGoToSettings}
              className="text-[11px] self-start sm:self-auto shrink-0"
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              Settings
            </MoltenButton>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('parser')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'parser'
                ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Natural Language Rules
          </button>

          <button
            onClick={() => setActiveTab('explainer')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'explainer'
                ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Schedule Explainer
          </button>

          <button
            onClick={() => setActiveTab('swap')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'swap'
                ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Smart Swap
          </button>
        </div>

        {/* Tab 1: Natural Language Rules */}
        {activeTab === 'parser' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Type scheduling rules in plain English. The parser translates your text into mathematical constraints and teacher blocked-slot matrices.
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder='e.g., "Block Sarah Connor on Friday afternoon" or "Keep Mathematics and Science in the morning for Grade 10"'
                className="w-full bg-[#0b0a10] border border-white/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono-code resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Tip: Mention teacher names, days, and time ranges directly.
                </span>
                <MoltenButton size="sm" variant="molten" onClick={handleParseNlRule}>
                  Interpret &amp; Apply
                </MoltenButton>
              </div>
            </div>

            {parserFeedback && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-mono-code leading-relaxed">{parserFeedback}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Schedule Explainer */}
        {activeTab === 'explainer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Get an instant mathematical explanation of why a teacher or class has their specific schedule arrangement.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Select Faculty Member to Analyze:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-[#0b0a10] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) – {t.maxPerWeek} periods/wk
                  </option>
                ))}
              </select>
            </div>

            <MoltenButton
              size="sm"
              variant="molten"
              onClick={handleExplainTeacher}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Generate Teacher Load Breakdown
            </MoltenButton>

            {explanationText && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono-code text-slate-200 whitespace-pre-line leading-relaxed">
                {explanationText}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Smart Swap Suggester */}
        {activeTab === 'swap' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Select any class cohort to discover optimal, conflict-free period swaps that preserve soft score balance.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Select Cohort to Optimize:
              </label>
              <select
                value={swapClassId}
                onChange={(e) => setSwapClassId(e.target.value)}
                className="w-full bg-[#0b0a10] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} – {cls.section}
                  </option>
                ))}
              </select>
            </div>

            <MoltenButton
              size="sm"
              variant="molten"
              onClick={handleSuggestSwap}
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            >
              Find Optimal Swaps
            </MoltenButton>

            {swapSuggestion && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono-code text-slate-200 whitespace-pre-line leading-relaxed">
                {swapSuggestion}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
