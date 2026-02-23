'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { AuthForm } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  signupHeading?: string;
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', signupHeading }: AuthModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
    window.location.reload();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="w-full max-w-md bg-white dark:bg-card rounded-2xl shadow-2xl shadow-black/10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-end px-6 pt-4">
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <AuthForm
              defaultMode={defaultMode}
              onSuccess={handleSuccess}
              signupHeading={signupHeading}
            />
          </div>
        </div>
      </div>
    </>
  );
}
