import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { MoltenButton } from '../MoltenButton';
import { ShieldCheck, Copy, Check } from 'lucide-react';

interface ConsentPayloadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  payload: any;
  model: string;
}

export const ConsentPayloadPreviewModal: React.FC<ConsentPayloadPreviewModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  payload,
  model,
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Privacy Consent & Data Preview"
      subtitle={`Review the exact anonymized JSON payload being sent to Google Gemini (${model})`}
      icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            No personal identities or student records included
          </div>

          <div className="flex items-center gap-2">
            <MoltenButton size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="molten"
              onClick={() => {
                onClose();
                onProceed();
              }}
              className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white"
            >
              Approve &amp; Generate with AI
            </MoltenButton>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Payload Size: <strong>{new Blob([jsonString]).size} bytes</strong></span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to clipboard' : 'Copy JSON'}
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-3.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono-code text-slate-300 whitespace-pre leading-relaxed select-all">
          {jsonString}
        </div>
      </div>
    </Modal>
  );
};
