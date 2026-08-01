/**
 * Dialog / Modal Component
 * 
 * Purpose:
 * Accessible modal dialog featuring focus management, keyboard Escape key listener,
 * backdrop click overlay, and structured Header/Body/Footer slot layout.
 * 
 * Future Backend Integration:
 * Used for interactive dialogs like confirming company unsave, question details preview,
 * or submission modals.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export function Dialog({ isOpen, onClose, title, children, footer, className }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-modal flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp',
          className
        )}
      >
        {/* Header Slot */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Slot */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600">
          {children}
        </div>

        {/* Footer Slot */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dialog;
