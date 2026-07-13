'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Printer, CreditCard, ChevronLeft } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);
}

export default function ExpenseListReportPage() {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(endOfMonth(today),   'yyyy-MM-dd'));
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, pageSize: '500' });
      const res = await fetch(`/api/finance/expenses?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, []);

  // Group by category name
  const grouped: Record<string, { items: any[]; total: number }> = {};
  for (const item of (data?.items ?? [])) {
    const cat = item.category?.name ?? 'Uncategorised';
    if (!grouped[cat]) grouped[cat] = { items: [], total: 0 };
    grouped[cat].items.push(item);
    grouped[cat].total += Number(item.amount);
  }
  const grandTotal = Object.values(grouped).reduce((s, g) => s + g.total, 0);

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Controls — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Expense Report</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
      </div>

      {/* Date filters */}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportPrintHeader title="Expense Report" subtitle={`Period: ${from} to ${to}`} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data && (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(grandTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{data.items?.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-category tables */}
          {Object.entries(grouped).sort(([,a],[,b]) => b.total - a.total).map(([cat, { items, total }]) => (
            <Card key={cat} className="shadow-sm border-border/50">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm flex justify-between">
                  <span>{cat}</span>
                  <span className="font-bold">{fmt(total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-y border-border">
                      <th className="text-left px-5 py-2 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-5 py-2 font-semibold text-muted-foreground">Description</th>
                      <th className="text-left px-5 py-2 font-semibold text-muted-foreground">Vendor</th>
                      <th className="text-left px-5 py-2 font-semibold text-muted-foreground">Method</th>
                      <th className="text-right px-5 py-2 font-semibold text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="px-5 py-2 text-muted-foreground whitespace-nowrap">
                          {format(new Date(item.date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-5 py-2">{item.description}</td>
                        <td className="px-5 py-2 text-muted-foreground">{item.vendor || '—'}</td>
                        <td className="px-5 py-2 text-muted-foreground">{item.paymentMethod || '—'}</td>
                        <td className="px-5 py-2 text-right font-mono">{fmt(Number(item.amount))}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-semibold">
                      <td colSpan={4} className="px-5 py-2 text-right text-xs">Subtotal</td>
                      <td className="px-5 py-2 text-right font-mono">{fmt(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}

          {/* Grand total */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4 min-w-64">
              <div className="flex justify-between items-center gap-8">
                <span className="font-bold text-sm">Grand Total</span>
                <span className="font-bold text-xl font-mono">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
