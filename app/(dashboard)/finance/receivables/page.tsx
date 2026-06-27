'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

export default function ReceivablesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/receivables');
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setData(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const rows: any[] = data?.rows ?? [];
  const totals = data?.totals ?? { totalOutstanding: 0, totalCurrent: 0, total31_60: 0, total61_90: 0, total90plus: 0 };

  const exportCsv = () => {
    const csvRows = [
      ['Customer', 'Total Outstanding', 'Current (0-30)', '31-60 Days', '61-90 Days', '90+ Days'],
      ...rows.map(r => [
        r.customerName,
        r.outstanding.toFixed(2),
        r.current.toFixed(2),
        r.days31_60.toFixed(2),
        r.days61_90.toFixed(2),
        r.days90plus.toFixed(2),
      ]),
      ['TOTAL', totals.totalOutstanding.toFixed(2), totals.totalCurrent.toFixed(2), totals.total31_60.toFixed(2), totals.total61_90.toFixed(2), totals.total90plus.toFixed(2)],
    ];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ar-aging.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Accounts Receivable
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.account ? `${data.account.code} — ${data.account.name} · ` : ''}AR aging report
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data || rows.length === 0}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total AR', value: totals.totalOutstanding, color: 'hsl(168 84% 26%)' },
          { label: 'Current (0-30)', value: totals.totalCurrent, color: undefined },
          { label: '31-60 Days', value: totals.total31_60, color: 'hsl(40 78% 47%)' },
          { label: '61-90 Days', value: totals.total61_90, color: '#f97316' },
          { label: '90+ Days', value: totals.total90plus, color: '#ef4444' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-border/50 p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
            <p className="text-lg font-bold" style={{ color: card.color }}>
              {loading ? '—' : `₦${fmt(card.value)}`}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Customer</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Outstanding</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Current (0-30)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">31-60 Days</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">61-90 Days</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">90+ Days</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No outstanding receivables</p>
                  </td>
                </tr>
              ) : (
                <>
                  {rows.map((r: any) => (
                    <tr key={r.customerId} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{r.customerName}</p>
                        {r.customerEmail && <p className="text-xs text-muted-foreground">{r.customerEmail}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold" style={{ color: 'hsl(168 84% 26%)' }}>
                        ₦{fmt(r.outstanding)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">{r.current > 0 ? `₦${fmt(r.current)}` : '—'}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: r.days31_60 > 0 ? 'hsl(40 78% 47%)' : undefined }}>
                        {r.days31_60 > 0 ? `₦${fmt(r.days31_60)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: r.days61_90 > 0 ? '#f97316' : undefined }}>
                        {r.days61_90 > 0 ? `₦${fmt(r.days61_90)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm" style={{ color: r.days90plus > 0 ? '#ef4444' : undefined }}>
                        {r.days90plus > 0 ? `₦${fmt(r.days90plus)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                    <td className="py-3 px-4 text-sm">TOTAL</td>
                    <td className="py-3 px-4 text-right font-mono" style={{ color: 'hsl(168 84% 26%)' }}>₦{fmt(totals.totalOutstanding)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">₦{fmt(totals.totalCurrent)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">₦{fmt(totals.total31_60)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">₦{fmt(totals.total61_90)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">₦{fmt(totals.total90plus)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
