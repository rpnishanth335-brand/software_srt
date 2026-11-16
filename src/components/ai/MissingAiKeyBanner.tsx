import React from 'react';
import { useTimetableStore } from '../../store/useTimetableStore';
import { Sparkles, ArrowRight } from 'lucide-react';
import { MoltenButton } from '../MoltenButton';

interface MissingAiKeyBannerProps {
  currentRouteName?: string;
  className?: string;
}

export const MissingAiKeyBanner: React.FC<MissingAiKeyBannerProps> = ({
  currentRouteName = 'generate',
  className = '',
}) => {
  const { setCurrentRoute } = useTimetableStore();

  const handleNavigateToSettings = () => {
    // Record where the user came from so they can return after saving
    try {
      sessionStorage.setItem('chronoforge_return_route', currentRouteName);
    } catch {
      // Ignore if sessionStorage disabled
    }
    setCurrentRoute('settings');
  };

  return (
    <div
      data-testid="missing-ai-key-banner"
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-amber-950/20 to-black/60 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 shadow-ember-glow">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Gemini AI Generation Ready
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono-code border border-purple-500/30">
              Optional Cloud Boost
            </span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Add your Gemini API key in Settings to use AI generation and conversational reasoning.
          </p>
        </div>
      </div>

      <MoltenButton
        size="sm"
        variant="molten"
        onClick={handleNavigateToSettings}
        className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white shrink-0 self-start sm:self-auto"
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Configure in Settings
      </MoltenButton>
    </div>
  );
};
