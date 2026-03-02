'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UIContextValue {
  // Auth modal
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;

  // Billing modal
  showBillingModal: boolean;
  setShowBillingModal: (show: boolean) => void;

  // Settings modal
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;

  // Lookup modal
  showLookupModal: boolean;
  setShowLookupModal: (show: boolean) => void;

  // Toast
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  rateLimitCountdown: number | null;
  setRateLimitCountdown: (countdown: number | null) => void;

  // Functions
  handleUpgradeClick: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const { user } = useAuth();

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (rateLimitCountdown === 0) {
        setRateLimitCountdown(null);
        setToastMessage(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setRateLimitCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    setToastMessage(`Rate limited. Please wait ${rateLimitCountdown} seconds...`);

    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  // Handle upgrade click
  const handleUpgradeClick = useCallback(() => {
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
    } else {
      setShowBillingModal(true);
    }
  }, [user]);

  const value: UIContextValue = {
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    showBillingModal,
    setShowBillingModal,
    showSettingsModal,
    setShowSettingsModal,
    showLookupModal,
    setShowLookupModal,
    toastMessage,
    setToastMessage,
    rateLimitCountdown,
    setRateLimitCountdown,
    handleUpgradeClick,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
