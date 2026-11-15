import React from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTimetableStore();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-white/20';
        let bgClass = 'bg-[#12101c]/95';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 shadow-emerald-500/10 shadow-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-red-500/50 shadow-red-500/10 shadow-lg';
          icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/50 shadow-amber-500/10 shadow-lg';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md text-slate-100 text-xs sm:text-sm animate-slideIn ${bgClass} ${borderClass}`}
          >
            {icon}
            <div className="flex-1 leading-snug break-words">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
