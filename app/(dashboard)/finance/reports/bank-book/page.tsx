'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Printer, Building2, ChevronLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);

export default function BankBookReportPage() {
  const today = new Date();
  const [from, setFrom]       = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [to, setTo]           = useState(format(endOfMonth(today),   'yyyy-MM-dd'));
  const [data, setData]       = useState<any>(null);
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (accId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (accId) params.set('accountId', accId);
      const res = await fetch(`/api/finance/bank-book?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (!accId && d.account?.id) setAccountId(d.account.id);
      }
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  const lines: any[] = data?.lines ?? [];

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Bank Book Report</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />Print
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm print:hidden">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
              <Input type="date" className="h-9 w-40" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              <Input type="date" className="h-9 w-40" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            {data?.allAccounts?.length > 1 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bank Account</label>
                <select
                  className="h-9 border border-input rounded-lg text-sm px-3 bg-background"
                  value={accountId}
                  onChange={e => { setAccountId(e.target.value); load(e.target.value); }}
                >
                  {data.allAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={() => load(accountId)} disabled={loading} className="h-9 gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-lg font-bold">Bank Book Report</h1>
        <p className="text-sm text-gray-600">Account: [{data?.account?.code}] {data?.account?.name}</p>
        <p className="text-sm text-gray-600">Period: {from} to {to}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 print:hidden">
            {[
              { label: 'Opening Balance', value: fmt(data.openingBalance ?? 0), color: '' },
              { label: 'Total Receipts (DR)', value: fmt(data.totals?.totalReceipts ?? 0), color: 'text-emerald-600' },
              { label: 'Total Payments (CR)', value: fmt(data.totals?.totalPayments ?? 0), color: 'text-red-600' },
            ].map(c => (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-24">Date</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-24">Ref</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-emerald-700 w-28">Receipts (DR)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-red-700 w-28">Payments (CR)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground w-32">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="border-b border-border/30 bg-amber-50/50">
                    <td className="px-4 py-2 text-muted-foreground">{from}</td>
                    <td className="px-4 py-2 font-medium">Opening Balance</td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right" />
                    <td className="px-4 py-2 text-right" />
                    <td className="px-4 py-2 text-right font-mono font-semibold">{fmt(data.openingBalance ?? 0)}</td>
                  </tr>
                  {lines.map((l: any) => (
                    <tr key={l.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-2 font-medium">{l.description}</td>
                      <td className="px-4 py-2 text-muted-foreground font-mono text-[10px]">{l.reference ?? l.entryNumber}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700">
                        {l.debit > 0 ? fmt(l.debit) : ''}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-red-700">
                        {l.credit > 0 ? fmt(l.credit) : ''}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(l.runningBalance)}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions in this period.</td></tr>
                  )}
                  {lines.length > 0 && (
                    <tr className="bg-muted/40 border-t border-border font-semibold">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-xs">Period Totals</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{fmt(data.totals?.totalReceipts ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-700">{fmt(data.totals?.totalPayments ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmt(data.totals?.closingBalance ?? 0)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closing summary */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4 min-w-72">
              <table className="text-sm text-right w-full">
                <tbody>
                  <tr><td className="pr-8 font-medium opacity-80">Opening Balance</td><td className="font-mono">{fmt(data.openingBalance ?? 0)}</td></tr>
                  <tr><td className="pr-8 font-medium opacity-80 text-emerald-200">+ Total Receipts</td><td className="font-mono">{fmt(data.totals?.totalReceipts ?? 0)}</td></tr>
                  <tr><td className="pr-8 font-medium opacity-80 text-red-200">− Total Payments</td><td className="font-mono">{fmt(data.totals?.totalPayments ?? 0)}</td></tr>
                  <tr className="border-t border-white/20">
                    <td className="pr-8 font-bold pt-1">Closing Balance</td>
                    <td className="font-bold font-mono text-lg pt-1">{fmt(data.totals?.closingBalance ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
