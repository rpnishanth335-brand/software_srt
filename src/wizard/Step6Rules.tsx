import React from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { 
  Sliders, 
  HelpCircle, 
  Lock, 
  BookOpen
} from 'lucide-react';
import { RuleConfig } from '../types';

export const Step6Rules: React.FC = () => {
  const { project, updateRules } = useTimetableStore();
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

  const hardRuleItems: Array<{
    key: keyof RuleConfig['hardRules'];
    label: string;
    description: string;
  }> = [
    {
      key: 'noTeacherClash',
      label: 'Zero Teacher Double-Booking',
      description: 'A teacher cannot be assigned to two classes during the same day and period.',
    },
    {
      key: 'noClassClash',
      label: 'Zero Class Double-Booking',
      description: 'A class cohort cannot have two subjects scheduled at the same time.',
    },
    {
      key: 'respectTeacherBlocked',
      label: 'Enforce Teacher Unavailability',
      description: 'Strictly observe blocked slots marked in faculty availability grids.',
    },
    {
      key: 'respectMaxPerDay',
      label: 'Enforce Max Periods per Day',
      description: 'Do not exceed teacher daily period limits.',
    },
    {
      key: 'doublePeriodsConsecutive',
      label: 'Atomic Consecutive Double Periods',
      description: '2-period lab lessons must occupy adjacent periods (e.g. P1–P2 or P3–P4).',
    },
    {
      key: 'doublePeriodsNoBreakCrossing',
      label: 'Never Cross Break Times',
      description: 'Double periods cannot span across recess or lunch breaks.',
    },
    {
      key: 'specialRoomClash',
      label: 'Special Room / Lab Exclusivity',
      description: 'Two classes cannot use the Physics Lab or Computer Lab at the same time.',
    },
  ];

  const softRuleItems: Array<{
    key: keyof RuleConfig['softWeights'];
    label: string;
    description: string;
    defaultVal: number;
  }> = [
    {
      key: 'spreadSubjectEvenly',
      label: 'Uniform Subject Dispersion',
      description: 'Spread subjects across distinct days rather than clustering multiple sessions on one day.',
      defaultVal: 85,
    },
    {
      key: 'heavySubjectsMorning',
      label: 'Cognitive Morning Priority',
      description: 'Place analytical theory subjects (Maths, Physics, Chem) before lunch.',
      defaultVal: 75,
    },
    {
      key: 'minimizeTeacherGaps',
      label: 'Compact Teacher Schedules',
      description: 'Minimize unproductive idle gaps between teaching periods for faculty.',
      defaultVal: 70,
    },
    {
      key: 'limitConsecutiveTeacher',
      label: 'Prevent Teacher Burnout',
      description: 'Avoid scheduling more than 3 continuous periods for any teacher.',
      defaultVal: 80,
    },
    {
      key: 'sportsActivityLastPeriods',
      label: 'End-of-Day Physical Activities',
      description: 'Favor scheduling Sports, PE, and outdoor activities in the final afternoon periods.',
      defaultVal: 90,
    },
    {
      key: 'consistentSubjectPeriod',
      label: 'Period Consistency',
      description: 'Keep regular subjects occurring at consistent clock times when possible.',
      defaultVal: 50,
    },
    {
      key: 'avoidEdgePeriodsTeacher',
      label: 'Faculty Travel Buffer',
      description: 'Avoid assigning single isolated periods at the extreme start/end of the day.',
      defaultVal: 40,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> Timetabling balances inviolable physical laws (Hard Rules) with educational best practices (Soft Preferences). Adjusting soft sliders shapes the Simulated Annealing cost function so the generator aligns with your school’s unique culture.
        </div>
      </div>

      {/* Section 1: Inviolable Hard Constraints */}
      <PlasmaGlass glow className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Inviolable Hard Constraints (0 Violations Allowed)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono-code">
                Mandatory
              </span>
            </h2>
            <p className="text-xs text-slate-400">The solver rejects any candidate schedule that violates these rules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hardRuleItems.map((item) => {
            const isChecked = rules.hardRules[item.key];
            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-white/5 border-red-500/40'
                    : 'bg-black/20 border-white/5 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleHardRuleToggle(item.key)}
                  className="mt-1 rounded border-white/20 accent-red-500 w-4 h-4 shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </PlasmaGlass>

      {/* Section 2: Soft Optimization Weights */}
      <PlasmaGlass className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Optimization Preferences (Soft Weights)
            </h2>
            <p className="text-xs text-slate-400">
              Drag sliders to set priority (0 = Ignore, 100 = Maximum Optimization Pressure)
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {softRuleItems.map((item) => {
            const weight = rules.softWeights[item.key];
            return (
              <div key={item.key} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[11px] text-slate-400 block">{item.description}</span>
                  </div>
                  <span className="text-xs font-mono-code font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {weight} / 100
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={weight}
                    onChange={(e) => handleSoftWeightChange(item.key, parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Free Period Policy Toggle */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs font-bold text-white">Study Hall / Free Period Policy</div>
              <div className="text-[11px] text-slate-400">
                Allow cohorts to have unassigned self-study periods if curriculum does not fill 100% of slots.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={rules.allowFreePeriods}
                onChange={(e) => updateRules({ allowFreePeriods: e.target.checked })}
                className="rounded border-white/20 accent-purple-500 w-4 h-4"
              />
              <span>Allow Free Periods</span>
            </label>

            {rules.allowFreePeriods && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono-code">
                <span>Max:</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={rules.maxFreePeriodsPerClass}
                  onChange={(e) => updateRules({ maxFreePeriodsPerClass: parseInt(e.target.value, 10) || 0 })}
                  className="w-12 px-2 py-1 rounded bg-[#0b0a10] border border-white/20 text-center font-bold text-purple-300"
                />
              </div>
            )}
          </div>
        </div>
      </PlasmaGlass>
    </div>
  );
};
