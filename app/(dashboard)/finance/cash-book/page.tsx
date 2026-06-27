'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function CashBookPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { from: defaultFrom, to: defaultTo } = getMonthRange();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/cash-book?from=${from}&to=${to}`);
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Entry #', 'Description', 'Receipts (Dr)', 'Payments (Cr)', 'Running Balance'],
      [`Opening Balance`, '', '', '', '', fmt(data.openingBalance)],
      ...(data.lines ?? []).map((l: any) => [
        new Date(l.date).toLocaleDateString('en-NG'),
        l.entryNumber,
        l.description ?? '',
        l.debit > 0 ? l.debit.toFixed(2) : '',
        l.credit > 0 ? l.credit.toFixed(2) : '',
        l.runningBalance.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `cash-book-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const lines: any[] = data?.lines ?? [];
  const totals = data?.totals ?? { totalReceipts: 0, totalPayments: 0, closingBalance: 0 };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Cash Book
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.account ? `${data.account.code} — ${data.account.name}` : 'Running ledger for cash account'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Opening Balance</p>
          <p className="text-lg font-bold">₦{loading ? '—' : fmt(data?.openingBalance ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Receipts</p>
          <p className="text-lg font-bold" style={{ color: 'hsl(168 84% 26%)' }}>₦{loading ? '—' : fmt(totals.totalReceipts)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Payments</p>
          <p className="text-lg font-bold text-destructive">₦{loading ? '—' : fmt(totals.totalPayments)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Closing Balance</p>
          <p className="text-lg font-bold" style={{ color: 'hsl(40 78% 47%)' }}>₦{loading ? '—' : fmt(totals.closingBalance)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Entry #</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Description</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Receipts (Dr)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Payments (Cr)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              {!loading && data && (
                <tr className="border-b border-border/40 bg-muted/20">
                  <td className="py-2.5 px-4 text-muted-foreground text-xs" colSpan={2}>{from}</td>
                  <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground">Opening Balance</td>
                  <td className="py-2.5 px-4 text-right" />
                  <td className="py-2.5 px-4 text-right" />
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">₦{fmt(data.openingBalance)}</td>
                </tr>
              )}
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Banknote className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No cash transactions in this period</p>
                  </td>
                </tr>
              ) : (
                lines.map((l: any, idx: number) => (
                  <tr key={l.id ?? idx} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-sm">
                      {new Date(l.date).toLocaleDateString('en-NG')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs">{l.entryNumber}</td>
                    <td className="py-2.5 px-4 text-sm">
                      <p>{l.description}</p>
                      {l.reference && <p className="text-xs text-muted-foreground">{l.reference}</p>}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm" style={{ color: l.debit > 0 ? 'hsl(168 84% 26%)' : undefined }}>
                      {l.debit > 0 ? `₦${fmt(l.debit)}` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm text-destructive">
                      {l.credit > 0 ? `₦${fmt(l.credit)}` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm font-semibold">
                      ₦{fmt(l.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
              {/* Closing balance row */}
              {!loading && lines.length > 0 && (
                <tr className="border-t-2 border-border bg-muted/20">
                  <td className="py-2.5 px-4 text-xs" colSpan={2}>{to}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">Closing Balance</td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold" style={{ color: 'hsl(168 84% 26%)' }}>
                    ₦{fmt(totals.totalReceipts)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-destructive">
                    ₦{fmt(totals.totalPayments)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-sm font-bold" style={{ color: 'hsl(40 78% 47%)' }}>
                    ₦{fmt(totals.closingBalance)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
