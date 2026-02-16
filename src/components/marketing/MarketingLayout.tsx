import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

interface MarketingLayoutProps {
  children: React.ReactNode;
  onSignIn?: () => void;
  onSignUp?: () => void;
}

export function MarketingLayout({ children, onSignIn, onSignUp }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      <MarketingHeader onSignIn={onSignIn} onSignUp={onSignUp} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
