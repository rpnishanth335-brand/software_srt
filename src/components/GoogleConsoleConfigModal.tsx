import React, { useState } from 'react';
import { 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { getGoogleClientId, setStoredGoogleClientId } from '../auth/googleOAuth';

interface GoogleConsoleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectAndSignIn: (clientId: string) => Promise<void>;
}

export const GoogleConsoleConfigModal: React.FC<GoogleConsoleConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectAndSignIn,
}) => {
  const [clientId, setClientId] = useState(getGoogleClientId());
  const [copiedOrigin, setCopiedOrigin] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const vercelOrigin = 'https://software-srt.vercel.app';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrigin(text);
    setTimeout(() => setCopiedOrigin(null), 2000);
  };

  const handleSaveAndConnect = async () => {
    const trimmed = clientId.trim();
    setValidationError(null);

    if (!trimmed) {
      setValidationError('Please enter your Google Cloud Console OAuth Client ID.');
      return;
    }

    if (!trimmed.includes('.apps.googleusercontent.com')) {
      setValidationError('Client ID must end with ".apps.googleusercontent.com" (e.g., 123456789-abc.apps.googleusercontent.com).');
      return;
    }

    setSaving(true);
    try {
      setStoredGoogleClientId(trimmed);
      await onConnectAndSignIn(trimmed);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to initialize Google Sign-In with this Client ID.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#0f0c1b] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Google Cloud Console OAuth
              </h3>
              <p className="text-xs text-slate-400">
                Connect your official Google OAuth 2.0 credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setup Steps */}
        <div className="py-5 space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
              <span>Create OAuth Client ID in Google Cloud Console:</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              Open Google Cloud Console Credentials, select <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong> &rarr; Application type: <strong>Web application</strong>.
            </p>
            <div className="pl-6 pt-1">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold underline text-[11px]"
              >
                <span>Open Google Cloud Console Credentials</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">2</span>
              <span>Add Authorized JavaScript Origins:</span>
            </div>
            <p className="text-slate-400 pl-6">
              Paste these URLs into <em>"Authorized JavaScript origins"</em> in Google Console:
            </p>
            <div className="pl-6 space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <code className="font-mono-code text-[11px] text-amber-300">{currentOrigin}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(currentOrigin)}
                  className="p-1 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedOrigin === currentOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOrigin === currentOrigin ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <code className="font-mono-code text-[11px] text-amber-300">{vercelOrigin}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(vercelOrigin)}
                  className="p-1 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedOrigin === vercelOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOrigin === vercelOrigin ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
              <span>Paste your Google OAuth Client ID:</span>
            </div>
            <div className="pl-6">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1234567890-xxx.apps.googleusercontent.com"
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-slate-100 placeholder-slate-500 text-xs focus:border-amber-400 focus:outline-none font-mono-code"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                You can also permanently save this in your project's <code className="text-amber-300">.env</code> file as <code className="text-amber-300">VITE_GOOGLE_CLIENT_ID</code>.
              </p>
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSaveAndConnect}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-ember-glow flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <span>Save & Connect with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
