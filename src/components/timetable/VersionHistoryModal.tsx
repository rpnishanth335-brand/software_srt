import React from 'react';
import { Project, TimetableVersion } from '../../types';
import { PlasmaGlass } from '../PlasmaGlass';
import { MoltenButton } from '../MoltenButton';
import { Clock, CheckCircle2, History, X, Sparkles } from 'lucide-react';

interface VersionHistoryModalProps {
  project: Project;
  currentVersionId?: string;
  onSelectVersion: (version: TimetableVersion) => void;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  project,
  currentVersionId,
  onSelectVersion,
  onClose,
}) => {
  const versions = project.timetables;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <PlasmaGlass glow className="w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Version History Snapshot
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono-code">
                  {versions.length} Saved
                </span>
              </h3>
              <p className="text-xs text-slate-400">Compare generation runs, soft scores, and roll back anytime</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {versions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono-code">
              No previous versions saved yet. Forge your first timetable in Step 8!
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isActive = ver.id === currentVersionId || (idx === 0 && !currentVersionId);

              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-inner'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        Run #{versions.length - idx} • Seed {ver.seed}
                      </span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Active
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono-code uppercase">
                        {ver.qualityMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono-code text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(ver.createdAt).toLocaleTimeString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Soft Score: <strong className="text-amber-300">{ver.softScore}</strong>
                      </span>
                      <span>
                        Hard Clashes: <strong className={ver.hardConflicts === 0 ? 'text-emerald-400' : 'text-red-400'}>{ver.hardConflicts}</strong>
                      </span>
                    </div>
                  </div>

                  {!isActive && (
                    <MoltenButton
                      size="sm"
                      variant="glass"
                      onClick={() => {
                        onSelectVersion(ver);
                        onClose();
                      }}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    >
                      Restore Version
                    </MoltenButton>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PlasmaGlass>
    </div>
  );
};
