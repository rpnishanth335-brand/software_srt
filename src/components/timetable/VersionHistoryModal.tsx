import React from 'react';
import { Project, TimetableVersion } from '../../types';
import { MoltenButton } from '../MoltenButton';
import { Clock, CheckCircle2, History, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-white">Version History Snapshot</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono-code border border-purple-500/30">
            {versions.length} Saved
          </span>
        </div>
      }
      subtitle="Compare generation runs, soft scores, and roll back anytime"
      icon={<History className="w-5 h-5 text-purple-300" />}
      footer={
        <MoltenButton size="sm" variant="ghost" onClick={onClose}>
          Close
        </MoltenButton>
      }
    >
      <div className="space-y-3">
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

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code text-slate-400">
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
    </Modal>
  );
};
