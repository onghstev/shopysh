'use client';

import { useState } from 'react';
import { Receipt, Download, RefreshCw, ChevronLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

const now = new Date();
const DEF_FROM = `${now.getFullYear()}-01-01`;
const DEF_TO   = now.toISOString().slice(0, 10);

export default function VATSummaryPage() {
  const [from, setFrom]   = useState(DEF_FROM);
  const [to, setTo]       = useState(DEF_TO);
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/reports/vat-summary?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Month', 'Output VAT (Sales)', 'Input VAT (Purchases)', 'Net VAT Payable'],
      ...data.monthly.map((m: any) => [m.month, m.outputVAT.toFixed(2), m.inputVAT.toFixed(2), m.netVAT.toFixed(2)]),
      ['TOTAL', data.outputVAT.total.toFixed(2), data.inputVAT.total.toFixed(2), data.vatPayable.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `vat-summary-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const monthly: any[] = data?.monthly ?? [];
  const vatPayable: number = data?.vatPayable ?? 0;
  const hasAccounts = data && (data.outputVAT.account || data.inputVAT.account);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/finance/reports" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">VAT Summary</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Output VAT (sales) vs Input VAT (purchases) — net payable to FIRS</p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-end gap-3 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-40 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-40 rounded-xl" />
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Generate
        </Button>
      </div>

      {/* No VAT accounts warning */}
      {data && !hasAccounts && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No VAT accounts found. Make sure your Chart of Accounts includes Output VAT (code 2200) and Input VAT (code 1600).
        </div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Output VAT Collected', value: data.outputVAT.total, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', sub: 'From sales / invoices' },
            { label: 'Input VAT Paid',        value: data.inputVAT.total,  color: 'text-sky-700 bg-sky-50 border-sky-200',             sub: 'From purchases / bills' },
            { label: 'Net VAT Payable',       value: vatPayable,           color: vatPayable >= 0 ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200', sub: vatPayable >= 0 ? 'Amount owed to FIRS' : 'VAT credit (refundable)' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className={`rounded-2xl border p-5 ${color}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
              <p className="text-2xl font-bold">{fmt(value)}</p>
              <p className="text-xs mt-1 opacity-70">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly breakdown */}
      {data && monthly.length > 0 && (
        <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-muted/30 border-b">
            <h2 className="font-semibold text-sm">Monthly Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output VAT</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input VAT</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {monthly.map((m: any) => (
                <tr key={m.month} className="hover:bg-muted/20">
                  <td className="py-2.5 px-5 font-medium">{m.month}</td>
                  <td className="py-2.5 px-5 text-right text-emerald-700">{fmt(m.outputVAT)}</td>
                  <td className="py-2.5 px-5 text-right text-sky-700">{fmt(m.inputVAT)}</td>
                  <td className={`py-2.5 px-5 text-right font-semibold ${m.netVAT >= 0 ? 'text-red-700' : 'text-green-700'}`}>{fmt(m.netVAT)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-muted/30 font-bold">
                <td className="py-3 px-5">TOTAL</td>
                <td className="py-3 px-5 text-right text-emerald-700">{fmt(data.outputVAT.total)}</td>
                <td className="py-3 px-5 text-right text-sky-700">{fmt(data.inputVAT.total)}</td>
                <td className={`py-3 px-5 text-right ${vatPayable >= 0 ? 'text-red-700' : 'text-green-700'}`}>{fmt(vatPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction detail */}
      {data && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Output VAT Transactions', items: data.outputVAT.entries, color: 'text-emerald-700' },
            { title: 'Input VAT Transactions',  items: data.inputVAT.entries,  color: 'text-sky-700'     },
          ].map(({ title, items, color }) => (
            <div key={title} className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-muted/30 border-b">
                <h3 className="font-semibold text-sm">{title} ({items.length})</h3>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions in this period</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/30">
                      <tr className="border-b">
                        <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Description</th>
                        <th className={`text-right px-4 py-2 font-semibold ${color}`}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((e: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2 truncate max-w-[160px]">{e.description}</td>
                          <td className={`px-4 py-2 text-right font-medium ${color}`}>{fmt(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Set the date range and click Generate</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      )}
    </div>
  );
}
