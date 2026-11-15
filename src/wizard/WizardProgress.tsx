import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Grid3X3, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { GooGroup } from '../components/GooGroup';

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const WIZARD_STEPS = [
  { step: 1, title: 'School Basics', shortTitle: 'Basics', icon: <Building2 className="w-4 h-4" /> },
  { step: 2, title: 'Classes', shortTitle: 'Classes', icon: <GraduationCap className="w-4 h-4" /> },
  { step: 3, title: 'Subjects', shortTitle: 'Subjects', icon: <BookOpen className="w-4 h-4" /> },
  { step: 4, title: 'Staff', shortTitle: 'Staff', icon: <Users className="w-4 h-4" /> },
  { step: 5, title: 'Assignments', shortTitle: 'Matrix', icon: <Grid3X3 className="w-4 h-4" /> },
  { step: 6, title: 'Rules', shortTitle: 'Rules', icon: <Sliders className="w-4 h-4" /> },
  { step: 7, title: 'Feasibility', shortTitle: 'Calculate', icon: <CheckCircle2 className="w-4 h-4" /> },
  { step: 8, title: 'Generate', shortTitle: 'Forge', icon: <Sparkles className="w-4 h-4" /> },
  { step: 9, title: 'View & Edit', shortTitle: 'Grid', icon: <Grid3X3 className="w-4 h-4" /> },
  { step: 10, title: 'Export', shortTitle: 'Export', icon: <ChevronRight className="w-4 h-4" /> },
];

export const WizardProgress: React.FC<WizardProgressProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full overflow-x-auto pb-3 pt-1">
      <GooGroup className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12101c]/80 backdrop-blur-xl border border-white/10 shadow-glass-specular min-w-max mx-auto">
        {WIZARD_STEPS.map((s, idx) => {
          const isActive = currentStep === s.step;
          const isPassed = currentStep > s.step;

          return (
            <React.Fragment key={s.step}>
              <button
                onClick={() => onStepClick(s.step)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-ember-600 via-ember-500 to-ember-plasma text-white shadow-ember-glow scale-105 z-20'
                    : isPassed
                    ? 'bg-white/10 text-ember-300 hover:bg-white/15 hover:text-white z-10'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 z-10'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono-code font-bold ${
                  isActive
                    ? 'bg-white text-ember-600 shadow-sm'
                    : isPassed
                    ? 'bg-ember-500/30 text-ember-200'
                    : 'bg-white/10 text-slate-400'
                }`}>
                  {isPassed ? '✓' : s.step}
                </span>

                <span className="hidden sm:inline tracking-wide">{s.title}</span>
                <span className="sm:hidden">{s.shortTitle}</span>
              </button>

              {idx < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </GooGroup>
    </div>
  );
};
