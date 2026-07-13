'use client';

import { useState } from 'react';
import { Scale, Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_COLORS: Record<string, string> = {
  ASSET: 'text-sky-700',
  LIABILITY: 'text-red-700',
  EQUITY: 'text-violet-700',
  INCOME: 'text-emerald-700',
  EXPENSE: 'text-amber-700',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

const now = new Date();
const DEF_FROM = `${now.getFullYear()}-01-01`;
const DEF_TO = now.toISOString().slice(0, 10);

export default function TrialBalancePage() {
  const [from, setFrom] = useState(DEF_FROM);
  const [to, setTo] = useState(DEF_TO);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/reports/trial-balance?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? { debit: 0, credit: 0, debitBalance: 0, creditBalance: 0 };

  const exportCsv = () => {
    const header = 'Code,Name,Type,Period Debit,Period Credit,Debit Balance,Credit Balance\n';
    const body = rows.map((r: any) =>
      `${r.code},"${r.name}",${r.accountType},${r.periodDebit},${r.periodCredit},${r.debitBalance},${r.creditBalance}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `trial-balance-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const isBalanced = data ? Math.abs(totals.debitBalance - totals.creditBalance) < 0.01 : null;

  return (
    <div className="space-y-5">
      <ReportPrintHeader title="Trial Balance" subtitle={data ? `Period: ${data.from ?? ''} to ${data.to ?? ''}` : undefined} />
      <div className="flex items-center gap-3">
        <Link href="/finance/reports" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Verify debits equal credits across all accounts</p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
          </Button>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-end gap-3 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Generate
        </Button>
      </div>

      {/* Balance indicator */}
      {data && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <Scale className="w-4 h-4" />
          {isBalanced ? 'Trial balance is in balance ✓' : `Out of balance — difference: ${fmt(Math.abs(totals.debitBalance - totals.creditBalance))}`}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Code</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Name</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Type</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Period Debit</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Period Credit</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">DR Balance</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">CR Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  {Array(7).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Scale className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {data ? 'No transactions in this period' : 'Select a date range and click Generate'}
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((r: any) => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-muted-foreground">{r.code}</td>
                  <td className="py-2.5 px-4 font-medium" style={{ paddingLeft: `${(Math.max(0, (r.level ?? 1) - 1)) * 16 + 16}px` }}>{r.name}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[11px] font-semibold ${TYPE_COLORS[r.accountType] ?? ''}`}>{r.accountType}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{r.periodDebit > 0 ? fmt(r.periodDebit) : '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{r.periodCredit > 0 ? fmt(r.periodCredit) : '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium">{r.debitBalance > 0 ? fmt(r.debitBalance) : '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium">{r.creditBalance > 0 ? fmt(r.creditBalance) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
          {data && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50 font-bold">
                <td className="py-3 px-4" colSpan={3}><span className="text-sm">TOTALS</span></td>
                <td className="py-3 px-4 text-right font-mono text-sm">{fmt(totals.debit)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{fmt(totals.credit)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{fmt(totals.debitBalance)}</td>
                <td className="py-3 px-4 text-right font-mono text-sm">{fmt(totals.creditBalance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
