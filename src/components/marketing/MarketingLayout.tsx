import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="force-light min-h-[100dvh] bg-white flex flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
