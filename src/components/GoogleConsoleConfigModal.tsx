import React, { useState } from 'react';
import { 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle
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
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsOrigins = [
    'https://software-srt.vercel.app',
    'http://localhost:5173'
  ];

  const redirectUris = [
    'https://software-srt.vercel.app/auth/callback',
    'https://software-srt.vercel.app',
    'http://localhost:5173/auth/callback',
    'http://localhost:5173'
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(text);
    setTimeout(() => setCopiedItem(null), 2000);
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
        className="relative w-full max-w-xl max-h-[90vh] bg-[#0f0c1b] border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Google Cloud Console OAuth Setup
              </h3>
              <p className="text-xs text-slate-400">
                Official Google credentials & Authorized Redirect URIs
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

        {/* Scrollable Setup Steps */}
        <div className="py-4 space-y-3.5 text-xs text-slate-300 overflow-y-auto pr-1">
          {/* Step 1: Console Link */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
              <span>Open Google Cloud Console Credentials:</span>
            </div>
            <p className="text-slate-400 pl-6 leading-relaxed">
              Go to Credentials &rarr; <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong> (Type: <strong>Web application</strong>).
            </p>
            <div className="pl-6 pt-0.5">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold underline text-[11px]"
              >
                <span>console.cloud.google.com/apis/credentials</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Step 2: Authorized JavaScript Origins */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">2</span>
              <span>Authorized JavaScript Origins:</span>
            </div>
            <p className="text-slate-400 pl-6 text-[11px]">
              Add these exact URIs under <em>"Authorized JavaScript origins"</em>:
            </p>
            <div className="pl-6 space-y-1">
              {jsOrigins.map((origin) => (
                <div key={origin} className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-black/40 border border-white/5">
                  <code className="font-mono-code text-[11px] text-amber-300">{origin}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(origin)}
                    className="p-1 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copiedItem === origin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedItem === origin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Authorized Redirect URIs */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="font-bold text-amber-200 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-[10px]">3</span>
              <span>Authorized Redirect URIs (Callbacks):</span>
            </div>
            <p className="text-slate-300 pl-6 text-[11px]">
              Add these exact URIs under <em>"Authorized redirect URIs"</em> in Google Console:
            </p>
            <div className="pl-6 space-y-1">
              {redirectUris.map((uri) => (
                <div key={uri} className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-black/50 border border-white/10">
                  <code className="font-mono-code text-[11px] text-amber-200 truncate mr-2">{uri}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(uri)}
                    className="p-1 rounded text-slate-300 hover:text-white shrink-0 flex items-center gap-1 text-[10px]"
                  >
                    {copiedItem === uri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedItem === uri ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Client ID */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">4</span>
              <span>Configured OAuth Client ID:</span>
            </div>
            <div className="pl-6">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="773332130592-xxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-slate-100 placeholder-slate-500 text-xs focus:border-amber-400 focus:outline-none font-mono-code"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Saved in Vercel & <code className="text-amber-300">.env</code> as <code className="text-amber-300">GOOGLE_CLIENT_ID</code>.
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
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
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
                <span>Connect & Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
