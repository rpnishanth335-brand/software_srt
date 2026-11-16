import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  preventBackdropClose?: boolean;
  bottomSheetOnMobile?: boolean;
  ariaLabel?: string;
  className?: string;
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-[440px]',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'md',
  preventBackdropClose = false,
  bottomSheetOnMobile = false,
  ariaLabel,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Lock body scroll and record previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Handle keyboard events (ESC and Focus Trap)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && !preventBackdropClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose, preventBackdropClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus the first actionable element on mount
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (focusable) {
        setTimeout(() => focusable.focus(), 50);
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid="modal-overlay"
          aria-modal="true"
          role="dialog"
          aria-label={typeof title === 'string' ? title : ariaLabel || 'Dialog'}
          className={`fixed inset-0 z-[9999] flex ${
            bottomSheetOnMobile ? 'items-end sm:items-center' : 'items-center'
          } justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md safe-area-inset`}
          onClick={handleBackdropClick}
          style={{
            height: '100dvh',
            width: '100vw',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Animated Modal Card */}
          <motion.div
            ref={modalRef}
            data-testid="modal-card"
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(6px)', y: bottomSheetOnMobile ? 40 : 0 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)', y: bottomSheetOnMobile ? 30 : 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`w-[calc(100%-24px)] sm:w-full ${maxWidthClasses[maxWidth]} max-h-[calc(100dvh-32px)] flex flex-col rounded-2xl sm:rounded-3xl bg-[#120f1f]/95 border border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(255,107,0,0.15)] text-slate-100 overflow-hidden relative ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ember Rim Glow Line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent pointer-events-none" />

            {/* Header */}
            {(title || icon) && (
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-ember-glow">
                      {icon}
                    </div>
                  )}
                  <div>
                    {typeof title === 'string' ? (
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {title}
                      </h3>
                    ) : (
                      title
                    )}
                    {subtitle && (
                      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                </div>

                {!preventBackdropClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close dialog"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm text-slate-300">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-white/10 bg-black/25 flex items-center justify-end gap-2.5 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
