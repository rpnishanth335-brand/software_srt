import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { MoltenButton } from './MoltenButton';

interface UserAvatarMenuProps {
  compact?: boolean;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({ compact = false }) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const handleSignOutConfirm = async () => {
    setShowConfirmLogout(false);
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        title={user.displayName || user.email || 'User Account'}
      >
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-amber-500/40 bg-black/40 shrink-0 flex items-center justify-center font-bold text-xs text-amber-300">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User Avatar'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {!compact && (
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
              {user.displayName || 'School Admin'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-code truncate max-w-[120px]">
              {user.email || 'Google Account'}
            </span>
          </div>
        )}

        {!compact && <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141021]/95 border border-white/15 backdrop-blur-xl shadow-2xl p-3 z-50 animate-fadeIn space-y-3">
            {/* User Bio */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-black/40 shrink-0 flex items-center justify-center font-bold text-sm text-amber-300">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">
                  {user.displayName || 'Administrator'}
                </div>
                <div className="text-[11px] text-slate-400 truncate font-mono-code">
                  {user.email}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Account</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1">
              <button
                onClick={() => setShowConfirmLogout(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:text-white hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out of ChronoForge</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#141021] border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-400">Are you sure you want to exit your session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5">
              All your timetable drafts are safely stored in your browser's IndexedDB and will reload automatically when you sign back in.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <MoltenButton
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmLogout(false)}
              >
                Cancel
              </MoltenButton>
              <MoltenButton
                size="sm"
                variant="molten"
                onClick={handleSignOutConfirm}
                className="bg-red-500/80 hover:bg-red-500 border-red-500/50"
              >
                Sign Out
              </MoltenButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
