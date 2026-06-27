'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function FinanceCustomersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/customers'); }, [router]);
  return <div className="p-8 text-center text-muted-foreground">Redirecting to Customers…</div>;
}
