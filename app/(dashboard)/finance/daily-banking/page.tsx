'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function DailyBankingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/finance/bank-book'); }, [router]);
  return <div className="p-8 text-center text-muted-foreground">Redirecting to Bank Book…</div>;
}
