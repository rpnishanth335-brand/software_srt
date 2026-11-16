import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { MoltenButton } from './MoltenButton';
import { Modal } from './ui/Modal';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="md"
      title={title}
      subtitle="Referential Integrity Check"
      icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <MoltenButton size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {affectedCount > 0 ? 'Cascade & Delete' : 'Delete'}
          </MoltenButton>
        </div>
      }
    >
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
    </Modal>
  );
};
