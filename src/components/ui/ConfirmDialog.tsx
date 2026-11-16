import React from 'react';
import { Modal } from './Modal';
import { MoltenButton } from '../MoltenButton';
import { AlertTriangle, LogOut, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'logout' | 'trash' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  note,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  iconType = 'trash',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'logout':
        return <LogOut className="w-5 h-5 text-red-400" />;
      case 'trash':
        return <Trash2 className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    }
    if (variant === 'warning') {
      return 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    }
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      preventBackdropClose={isLoading}
      title={title}
      subtitle={description}
      icon={getIcon()}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <MoltenButton
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </MoltenButton>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={onConfirm}
            disabled={isLoading}
            className={getConfirmButtonClasses()}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </MoltenButton>
        </div>
      }
    >
      {note && (
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 leading-relaxed">
          {note}
        </div>
      )}
    </Modal>
  );
};
