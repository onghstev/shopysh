'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ExpensesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/finance/purchase-book'); }, [router]);
  return <div className="p-8 text-center text-muted-foreground">Redirecting to Purchase Book…</div>;
}
