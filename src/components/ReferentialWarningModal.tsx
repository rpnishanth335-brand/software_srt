import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { MoltenButton } from './MoltenButton';
import { PlasmaGlass } from './PlasmaGlass';

interface ReferentialWarningModalProps {
  isOpen: boolean;
  title: string;
  entityName: string;
  affectedCount: number;
  details: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ReferentialWarningModal: React.FC<ReferentialWarningModalProps> = ({
  isOpen,
  title,
  entityName,
  affectedCount,
  details,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <PlasmaGlass glow className="max-w-md w-full p-6 border-red-500/40 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Referential Integrity Check</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 space-y-3">
          <p>
            Are you sure you want to delete <strong className="text-amber-300 font-semibold">{entityName}</strong>?
          </p>

          {affectedCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs space-y-2">
              <div className="font-semibold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                This action will affect {affectedCount} related item{affectedCount > 1 ? 's' : ''}:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
              <div className="text-[11px] text-red-400/90 pt-1">
                Cascade cleanup will automatically unlink or remove these references.
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">
              No active assignments or schedule links depend on this entity. It is safe to delete.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <MoltenButton size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={onConfirm}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {affectedCount > 0 ? 'Cascade & Delete' : 'Delete'}
          </MoltenButton>
        </div>
      </PlasmaGlass>
    </div>
  );
};
