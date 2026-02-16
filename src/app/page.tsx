'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { MarketingPage } from '@/components/marketing/MarketingPage';

export default function Home() {
  const {
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
  } = useAppContext();

  const [signupHeading, setSignupHeading] = useState<string | undefined>();

  return (
    <>
      <MarketingPage
        onSignIn={() => {
          setSignupHeading(undefined);
          setAuthMode('signin');
          setShowAuthModal(true);
        }}
        onSignUp={() => {
          setSignupHeading(undefined);
          setAuthMode('signup');
          setShowAuthModal(true);
        }}
        onSearchSignUp={() => {
          setSignupHeading('Sign up to see your results');
          setAuthMode('signup');
          setShowAuthModal(true);
        }}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
        signupHeading={signupHeading}
      />
    </>
  );
}
