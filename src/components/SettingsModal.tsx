'use client';

import { useState } from 'react';
import { X, User, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
}

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'danger'>('profile');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || '';

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Account deleted successfully - clear all local data and redirect
      try {
        sessionStorage.clear();
        localStorage.removeItem('packleads_session');
        localStorage.removeItem('packleads_sid');
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
      // Force immediate redirect using setTimeout to ensure it runs
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} role="presentation" />

      <div role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className="relative bg-white rounded-2xl elevation-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 flex items-center justify-between z-10">
          <h2 id="settings-modal-title" className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <span className="text-sm hidden sm:inline">Back to Results</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-gray-900 border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'danger'
                ? 'text-red-400 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {userName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {userEmail}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">User ID</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500 font-mono text-sm">
                      {user.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Created */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Account Details</h3>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Account created</span>
                    <span className="text-gray-900 text-sm">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                To update your profile information, please contact support.
              </p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-medium">Danger Zone</h3>
                    <p className="text-red-400/70 text-sm mt-1">
                      Actions in this section are irreversible. Please proceed with caution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="border border-red-500/20 rounded-lg p-4">
                <h4 className="text-gray-900 font-medium mb-2">Delete Account</h4>
                <p className="text-gray-500 text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  <li>- Your profile will be deleted</li>
                  <li>- All saved searches will be removed</li>
                  <li>- Your subscription will be canceled</li>
                  <li>- All data will be permanently erased</li>
                </ul>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete my account
                  </button>
                ) : (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-4 py-2 bg-gray-100 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    {error && (
                      <p role="alert" className="text-sm text-red-400">{error}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmation('');
                          setError(null);
                        }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Permanently Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
