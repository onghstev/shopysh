'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function InvoicesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/finance/sales-book'); }, [router]);
  return <div className="p-8 text-center text-muted-foreground">Redirecting to Sales Book…</div>;
}
