import QuickEntry from '@/components/finance/quick-entry';
import FinanceAIChat from '@/components/finance/finance-ai-chat';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FinanceAIChat />
      <QuickEntry />
    </>
  );
}
