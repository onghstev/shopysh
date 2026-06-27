'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
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

function getTypeLabel(t: string) {
  if (t === 'SALES_INVOICE') return 'Invoice';
  if (t === 'SALES_RECEIPT') return 'Receipt';
  if (t === 'CREDIT_NOTE') return 'Credit Note';
  return t;
}

function getTypeBadge(t: string) {
  if (t === 'SALES_INVOICE') return 'bg-emerald-100 text-emerald-700';
  if (t === 'SALES_RECEIPT') return 'bg-sky-100 text-sky-700';
  if (t === 'CREDIT_NOTE') return 'bg-amber-100 text-amber-700';
  return 'bg-muted text-muted-foreground';
}

export default function SalesBookPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const { from: defaultFrom, to: defaultTo } = getMonthRange();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/sales-book?from=${from}&to=${to}&page=${page}&limit=${limit}`);
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      setTotals(data.totals ?? { totalDebit: 0, totalCredit: 0 });
    } finally { setLoading(false); }
  }, [from, to, page]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Entry #', 'Type', 'Description', 'Reference', 'Total Debit', 'Total Credit', 'Status'],
      ...entries.map(e => [
        new Date(e.entryDate).toLocaleDateString('en-NG'),
        e.entryNumber,
        getTypeLabel(e.entryType),
        e.description ?? '',
        e.reference ?? '',
        Number(e.totalDebit).toFixed(2),
        Number(e.totalCredit).toFixed(2),
        e.status,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `sales-book-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Sales Book
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Posted sales invoices, receipts &amp; credit notes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total AR / Debit</p>
          <p className="text-xl font-bold" style={{ color: 'hsl(168 84% 26%)' }}>₦{fmt(totals.totalDebit)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Sales / Credit</p>
          <p className="text-xl font-bold" style={{ color: 'hsl(40 78% 47%)' }}>₦{fmt(totals.totalCredit)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Entries</p>
          <p className="text-xl font-bold">{total}</p>
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Description / Reference</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Debit (AR)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Credit (Sales)</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No entries found for this period</p>
                  </td>
                </tr>
              ) : (
                entries.map(e => {
                  // Find AR line (debit) and Sales line (credit)
                  const arLine = e.lines?.find((l: any) => l.account?.systemTag === 'AR' && Number(l.debit) > 0);
                  const salesLine = e.lines?.find((l: any) => l.account?.systemTag === 'SALES' && Number(l.credit) > 0);
                  const vatLine = e.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT' && Number(l.credit) > 0);

                  return (
                    <tr key={e.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(e.entryDate).toLocaleDateString('en-NG')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{e.entryNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getTypeBadge(e.entryType)}`}>
                          {getTypeLabel(e.entryType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{e.description}</p>
                        {e.reference && <p className="text-xs text-muted-foreground">{e.reference}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {arLine ? `₦${fmt(Number(arLine.debit))}` : `₦${fmt(Number(e.totalDebit))}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {salesLine ? `₦${fmt(Number(salesLine.credit))}` : `₦${fmt(Number(e.totalCredit))}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
