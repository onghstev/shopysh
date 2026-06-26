'use client';

import { useState } from 'react';
import { BarChart3, Download, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

const now = new Date();

function Section({ title, rows, total, color }: { title: string; rows: any[]; total: number; color: string }) {
  return (
    <>
      <tr className={color}><td colSpan={3} className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider">{title}</td></tr>
      {rows.map((r: any) => (
        <tr key={r.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
          <td className="py-2 px-4 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
          <td className="py-2 px-4 text-sm" style={{ paddingLeft: `${(Math.max(0, (r.level ?? 1) - 1)) * 16 + 16}px` }}>{r.name}</td>
          <td className="py-2 px-4 text-right font-mono text-sm">{fmt(r.balance)}</td>
        </tr>
      ))}
      <tr className="border-b border-border bg-muted/30">
        <td className="py-3 px-4 w-20" />
        <td className="py-3 px-4 text-sm font-bold">Total {title.split(' ').slice(-1)[0]}</td>
        <td className="py-3 px-4 text-right font-mono text-sm font-bold">{fmt(total)}</td>
      </tr>
    </>
  );
}

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(now.toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/reports/balance-sheet?asOf=${asOf}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  const s = data?.summary;

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Section', 'Code', 'Name', 'Amount'],
      ...data.assets.map((r: any) => ['ASSETS', r.code, r.name, r.balance]),
      ['ASSETS', '', 'TOTAL ASSETS', s.totalAssets],
      ...data.liabilities.map((r: any) => ['LIABILITIES', r.code, r.name, r.balance]),
      ['LIABILITIES', '', 'TOTAL LIABILITIES', s.totalLiabilities],
      ...data.equity.map((r: any) => ['EQUITY', r.code, r.name, r.balance]),
      ['EQUITY', '', 'Current Year Net Income', s.retainedNetIncome],
      ['EQUITY', '', 'TOTAL EQUITY', s.totalEquity + s.retainedNetIncome],
      ['', '', 'TOTAL LIABILITIES + EQUITY', s.totalLiabEquity],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `balance-sheet-as-of-${asOf}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/finance/reports" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Balance Sheet</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Statement of financial position</p>
        </div>
        {data && <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>}
      </div>

      <div className="flex items-end gap-3 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs">As of Date</Label>
          <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="h-9 rounded-xl w-44" />
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Generate
        </Button>
      </div>

      {s && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${s.isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <BarChart3 className="w-4 h-4" />
          {s.isBalanced
            ? `Balanced ✓ — Total Assets: ${fmt(s.totalAssets)}`
            : `Out of balance — Assets: ${fmt(s.totalAssets)}, Liabilities+Equity: ${fmt(s.totalLiabEquity)}`
          }
        </div>
      )}

      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Code</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(12).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  {Array(3).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
            ) : !data ? (
              <tr>
                <td colSpan={3} className="py-16 text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a date and click Generate</p>
                </td>
              </tr>
            ) : (
              <>
                <Section title="ASSETS" rows={data.assets} total={s.totalAssets} color="bg-sky-50/70 text-sky-700" />
                <Section title="LIABILITIES" rows={data.liabilities} total={s.totalLiabilities} color="bg-red-50/70 text-red-700" />

                <tr className="bg-violet-50/70"><td colSpan={3} className="py-2.5 px-4 text-xs font-bold text-violet-700 uppercase tracking-wider">EQUITY</td></tr>
                {data.equity.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                    <td className="py-2 px-4 font-mono text-xs text-muted-foreground">{r.code}</td>
                    <td className="py-2 px-4 text-sm">{r.name}</td>
                    <td className="py-2 px-4 text-right font-mono text-sm">{fmt(r.balance)}</td>
                  </tr>
                ))}
                {s.retainedNetIncome !== 0 && (
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-4 font-mono text-xs text-muted-foreground">—</td>
                    <td className="py-2 px-4 text-sm italic text-muted-foreground">Current Year Net Income</td>
                    <td className={`py-2 px-4 text-right font-mono text-sm ${s.retainedNetIncome >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(s.retainedNetIncome)}</td>
                  </tr>
                )}
                <tr className="border-b border-border bg-muted/30">
                  <td className="py-3 px-4" />
                  <td className="py-3 px-4 text-sm font-bold">Total Equity</td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-bold">{fmt(s.totalEquity + s.retainedNetIncome)}</td>
                </tr>

                <tr className="border-t-2 border-border bg-muted/50">
                  <td className="py-4 px-4" />
                  <td className="py-4 px-4 font-bold text-base">TOTAL LIABILITIES + EQUITY</td>
                  <td className="py-4 px-4 text-right font-mono text-base font-bold">{fmt(s.totalLiabEquity)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
