import QuickEntry from '@/components/finance/quick-entry';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <QuickEntry />
    </>
  );
}
