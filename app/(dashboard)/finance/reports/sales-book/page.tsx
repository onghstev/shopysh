'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, BookOpen, ChevronLeft } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SALES_INVOICE: { label: 'Invoice',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  SALES_RECEIPT: { label: 'Receipt',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  CREDIT_NOTE:   { label: 'Credit Note', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function SalesBookReportPage() {
  const today = new Date();
  const [from, setFrom]     = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [to, setTo]         = useState(format(endOfMonth(today),   'yyyy-MM-dd'));
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/sales-book?from=${from}&to=${to}&limit=200`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  const entries: any[] = data?.entries ?? [];

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Sales Book Report</h1>
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
            <Button onClick={load} disabled={loading} className="h-9 gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportPrintHeader title="Sales Book Report" subtitle={`Period: ${from} to ${to}`} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 print:hidden">
            {[
              { label: 'Total Entries', value: String(data.total ?? entries.length), color: '' },
              { label: 'Total Debit (AR / Cash)', value: fmt(data.totals?.totalDebit ?? 0), color: 'text-blue-600' },
              { label: 'Total Credit (Sales)', value: fmt(data.totals?.totalCredit ?? 0), color: 'text-emerald-600' },
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
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Entry #</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Reference</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-blue-700">Debit (DR)</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-emerald-700">Credit (CR)</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground print:hidden">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e: any) => {
                    const meta = TYPE_LABELS[e.entryType] ?? { label: e.entryType, color: 'bg-muted text-muted-foreground' };
                    return (
                      <tr key={e.id} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                          {format(new Date(e.entryDate), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-2 font-mono text-muted-foreground">{e.entryNumber}</td>
                        <td className="px-4 py-2 font-medium">{e.description}</td>
                        <td className="px-4 py-2 text-muted-foreground font-mono">{e.reference ?? '—'}</td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-blue-700">{fmt(Number(e.totalDebit))}</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-700">{fmt(Number(e.totalCredit))}</td>
                        <td className="px-4 py-2 text-center print:hidden">
                          <Badge variant={e.status === 'POSTED' ? 'default' : 'outline'}
                            className={`text-[10px] ${e.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-amber-600 border-amber-200'}`}>
                            {e.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No sales entries in this period.</td></tr>
                  )}
                </tbody>
                {entries.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/30 border-t border-border font-semibold">
                      <td colSpan={5} className="px-4 py-2.5 text-right text-xs">Period Totals</td>
                      <td className="px-4 py-2.5 text-right font-mono text-blue-700">{fmt(data.totals?.totalDebit ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{fmt(data.totals?.totalCredit ?? 0)}</td>
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
