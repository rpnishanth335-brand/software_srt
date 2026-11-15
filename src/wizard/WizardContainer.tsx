import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { WizardProgress } from './WizardProgress';
import { Step1SchoolBasics } from './Step1SchoolBasics';
import { Step2Classes } from './Step2Classes';
import { Step3Subjects } from './Step3Subjects';
import { Step4Staff } from './Step4Staff';
import { Step5Assignments } from './Step5Assignments';
import { Step6Rules } from './Step6Rules';
import { Step7Feasibility } from './Step7Feasibility';
import { Step8Generate } from './Step8Generate';
import { Step9ViewEdit } from './Step9ViewEdit';
import { Step10Export } from './Step10Export';
import { MoltenButton } from '../components/MoltenButton';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Clock,
  HardDrive,
  Bot
} from 'lucide-react';

export const WizardContainer: React.FC = () => {
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const { 
    activeStep, 
    setStep, 
    loadDemoSchool, 
    resetProject, 
    isDirty, 
    lastSavedAt 
  } = useTimetableStore();

  const handleNext = () => {
    if (activeStep < 10) {
      setStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Utility Header: Demo Loader & Autosave Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={loadDemoSchool}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-ember-gold" />}
          >
            Load Demo School (8 Classes, 12 Teachers)
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="ghost"
            onClick={resetProject}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setShowAiModal(true)}
            leftIcon={<Bot className="w-3.5 h-3.5 text-purple-400" />}
          >
            AI Assistant
          </MoltenButton>
        </div>

        {/* Real-time IndexedDB Autosave Status */}
        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-ember-400" />
          <span>IndexedDB:</span>
          {isDirty ? (
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> Saving...
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-saved ({new Date(lastSavedAt).toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>

      {/* Wizard Progress Rail with Gooey Indicator */}
      <WizardProgress currentStep={activeStep} onStepClick={setStep} />

      {/* Dynamic Step View */}
      <div className="pt-2">
        {activeStep === 1 && <Step1SchoolBasics />}
        {activeStep === 2 && <Step2Classes />}
        {activeStep === 3 && <Step3Subjects />}
        {activeStep === 4 && <Step4Staff />}
        {activeStep === 5 && <Step5Assignments />}
        {activeStep === 6 && <Step6Rules />}
        {activeStep === 7 && <Step7Feasibility />}
        {activeStep === 8 && <Step8Generate />}
        {activeStep === 9 && <Step9ViewEdit />}
        {activeStep === 10 && <Step10Export />}
      </div>

      {/* Persistent Bottom Navigation Rail */}
      <div className="sticky bottom-4 z-40 p-4 rounded-2xl bg-[#0b0a10]/90 backdrop-blur-2xl border border-white/10 shadow-glass-specular flex items-center justify-between">
        <MoltenButton
          size="md"
          variant="glass"
          disabled={activeStep <= 1}
          onClick={handlePrev}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </MoltenButton>

        <div className="text-xs font-mono-code text-slate-400 hidden sm:block">
          Step <span className="text-amber-300 font-bold">{activeStep}</span> of 10
        </div>

        <MoltenButton
          size="md"
          variant="molten"
          disabled={activeStep >= 10}
          onClick={handleNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {activeStep === 6 ? 'Proceed to Feasibility' : activeStep === 9 ? 'Proceed to Export' : 'Save & Continue'}
        </MoltenButton>
      </div>

      {/* Optional AI Assistant Modal */}
      <AiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
    </div>
  );
};
