import React from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Sliders, 
  HelpCircle, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  HeartHandshake, 
  GraduationCap, 
  SlidersHorizontal 
} from 'lucide-react';
import { RuleConfig } from '../types';

export const RulesPage: React.FC = () => {
  const { project, updateRules, addToast } = useTimetableStore();
  const { rules } = project;

  const handleHardRuleToggle = (key: keyof RuleConfig['hardRules']) => {
    updateRules({
      hardRules: {
        ...rules.hardRules,
        [key]: !rules.hardRules[key],
      },
    });
  };

  const handleSoftWeightChange = (key: keyof RuleConfig['softWeights'], value: number) => {
    updateRules({
      softWeights: {
        ...rules.softWeights,
        [key]: value,
      },
    });
  };

  // Presets
  const applyPreset = (preset: 'balanced' | 'academic' | 'teacher') => {
    if (preset === 'balanced') {
      updateRules({
        softWeights: {
          spreadSubjects: 8,
          minimizeTeacherGaps: 6,
          preferMorningForCore: 7,
          respectPreferredOffDay: 6,
          balanceDailyLoad: 7,
          respectRoomCapacity: 8,
        },
      });
      addToast('Applied "Balanced Default" optimization preset.', 'info');
    } else if (preset === 'academic') {
      updateRules({
        softWeights: {
          spreadSubjects: 10,
          minimizeTeacherGaps: 4,
          preferMorningForCore: 10,
          respectPreferredOffDay: 4,
          balanceDailyLoad: 9,
          respectRoomCapacity: 9,
        },
      });
      addToast('Applied "Strict Academic" optimization preset.', 'info');
    } else if (preset === 'teacher') {
      updateRules({
        softWeights: {
          spreadSubjects: 6,
          minimizeTeacherGaps: 10,
          preferMorningForCore: 5,
          respectPreferredOffDay: 10,
          balanceDailyLoad: 6,
          respectRoomCapacity: 7,
        },
      });
      addToast('Applied "Teacher-Friendly" optimization preset.', 'info');
    }
  };

  const hardRuleItems: Array<{
    key: keyof RuleConfig['hardRules'];
    label: string;
    description: string;
  }> = [
    {
      key: 'noTeacherClash',
      label: 'Zero Teacher Double-Booking',
      description: 'A teacher cannot be scheduled to teach two different classes in the same period.',
    },
    {
      key: 'noClassClash',
      label: 'Zero Class Double-Booking',
      description: 'A student cohort cannot be assigned two subjects at the exact same period.',
    },
    {
      key: 'respectTeacherBlocked',
      label: 'Strict Teacher Unavailability',
      description: 'Strictly respect marked off-periods and blocked time slots for all faculty.',
    },
    {
      key: 'respectMaxPerDay',
      label: 'Teacher Daily Period Limits',
      description: 'Never exceed the maximum periods per day defined for any faculty member.',
    },
    {
      key: 'doublePeriodsConsecutive',
      label: 'Consecutive Lab Blocks',
      description: 'Practical labs (double periods) must always be placed consecutively (e.g. P1–P2).',
    },
    {
      key: 'doublePeriodsNoBreakCrossing',
      label: 'Never Split Across Breaks',
      description: 'Double periods cannot span across recess or lunch bell timings.',
    },
    {
      key: 'specialRoomClash',
      label: 'Room & Lab Exclusivity',
      description: 'Two classes cannot use the same special room, court, or laboratory simultaneously.',
    },
  ];

  const softRuleItems: Array<{
    key: keyof RuleConfig['softWeights'];
    label: string;
    description: string;
  }> = [
    {
      key: 'spreadSubjects',
      label: 'Curriculum Spread Across Week',
      description: 'Avoid clustering multiple lessons of the same subject on the same day unless double period.',
    },
    {
      key: 'minimizeTeacherGaps',
      label: 'Minimize Faculty Idle Windows',
      description: 'Consolidate teacher teaching schedules to reduce idle waiting periods between classes.',
    },
    {
      key: 'preferMorningForCore',
      label: 'Morning Priority for Core Cognitive Subjects',
      description: 'Prioritize Mathematics, Physics, and Chemistry during earlier morning periods.',
    },
    {
      key: 'respectPreferredOffDay',
      label: 'Honor Faculty Preferred Off-Days',
      description: 'Heavily weight part-time and senior faculty preferred off-days during schedule generation.',
    },
    {
      key: 'balanceDailyLoad',
      label: 'Class Daily Workload Equalization',
      description: 'Distribute study hours smoothly throughout the week to prevent exhausting student days.',
    },
    {
      key: 'respectRoomCapacity',
      label: 'Optimal Room Sizing Preference',
      description: 'Ensure student class strength comfortably matches the allocated room capacity.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Rules &amp; Optimization Sliders
            </h1>
            <p className="text-xs text-slate-400">
              Configure non-negotiable hard constraints and fine-tune simulated annealing soft weights
            </p>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => applyPreset('academic')}
            leftIcon={<GraduationCap className="w-3.5 h-3.5 text-blue-400" />}
          >
            Strict Academic
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => applyPreset('teacher')}
            leftIcon={<HeartHandshake className="w-3.5 h-3.5 text-rose-400" />}
          >
            Teacher-Friendly
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => applyPreset('balanced')}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Balanced Default
          </MoltenButton>
        </div>
      </div>

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How this works:</span> Hard constraints must have zero violations for a timetable to be valid. Soft weights guide the simulated annealing solver to evaluate trade-offs between student learning rhythm and teacher convenience.
        </div>
      </div>

      {/* Hard Constraints Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Hard Constraints (Zero Violations Allowed)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hardRuleItems.map((rule) => {
            const isEnabled = rules.hardRules[rule.key];
            return (
              <PlasmaGlass
                key={rule.key}
                className={`p-4 border transition-all ${
                  isEnabled
                    ? 'border-emerald-500/30 bg-[#141224]/80'
                    : 'border-red-500/30 bg-red-950/20 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-400' : 'text-red-400'}`} />
                      {rule.label}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleHardRuleToggle(rule.key)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                    }`}
                  >
                    {isEnabled ? 'Enforced' : 'Disabled'}
                  </button>
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      </div>

      {/* Soft Preferences Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Soft Optimization Weights (0–10 Importance Scale)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {softRuleItems.map((rule) => {
            const currentVal = rules.softWeights[rule.key] ?? 5;
            return (
              <PlasmaGlass key={rule.key} className="p-4 border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">{rule.label}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                  </div>
                  <div className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono-code font-bold text-xs border border-amber-500/40">
                    Weight: {currentVal}
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={currentVal}
                    onChange={(e) => handleSoftWeightChange(rule.key, parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                    <span>0 (Ignore)</span>
                    <span>5 (Balanced)</span>
                    <span>10 (Max Priority)</span>
                  </div>
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      </div>
    </div>
  );
};
