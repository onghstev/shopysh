'use client';

import { useState } from 'react';
import { TrendingUp, Download, RefreshCw, ChevronLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const now = new Date();
const DEF_FROM = `${now.getFullYear()}-01-01`;
const DEF_TO = now.toISOString().slice(0, 10);

function SectionRows({ rows }: { rows: any[] }) {
  return (
    <>
      {rows.map((r: any) => (
        <tr key={r.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
          <td className="py-2 px-4 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
          <td className="py-2 px-4 text-sm" style={{ paddingLeft: `${(Math.max(0, (r.level ?? 1) - 1)) * 16 + 16}px` }}>{r.name}</td>
          <td className="py-2 px-4 text-right font-mono text-sm">{fmt(r.amount)}</td>
        </tr>
      ))}
    </>
  );
}

function SummaryRow({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  return (
    <tr className={`border-b border-border/50 ${bold ? 'bg-muted/30' : ''}`}>
      <td className="py-3 px-4 w-20" />
      <td className={`py-3 px-4 text-sm ${bold ? 'font-bold' : 'font-semibold text-muted-foreground'}`}>{label}</td>
      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${color ?? ''}`}>{fmt(value)}</td>
    </tr>
  );
}

export default function IncomeStatementPage() {
  const [from, setFrom] = useState(DEF_FROM);
  const [to, setTo] = useState(DEF_TO);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/reports/income-statement?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  const s = data?.summary;

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Category', 'Account Code', 'Account Name', 'Amount'],
      ...data.revenue.map((r: any) => ['Revenue', r.code, r.name, r.amount]),
      ['Revenue', '', 'TOTAL REVENUE', s.totalRevenue],
      ...data.cogs.map((r: any) => ['COGS', r.code, r.name, r.amount]),
      ['COGS', '', 'TOTAL COGS', s.totalCOGS],
      ['', '', 'GROSS PROFIT', s.grossProfit],
      ...data.opex.map((r: any) => ['OpEx', r.code, r.name, r.amount]),
      ['OpEx', '', 'TOTAL OPEX', s.totalOpex],
      ['', '', 'NET PROFIT', s.netProfit],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `income-statement-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/finance/reports" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Income Statement</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Profit & Loss report</p>
        </div>
        {data && <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>}
      </div>

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

      {/* Summary KPIs */}
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue',  value: s.totalRevenue,  color: 'text-emerald-600' },
            { label: 'Gross Profit',   value: s.grossProfit,   color: s.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive', sub: `${s.grossMargin.toFixed(1)}% margin` },
            { label: 'Operating Exp.', value: s.totalOpex,     color: 'text-amber-600' },
            { label: 'Net Profit',     value: s.netProfit,     color: s.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive', sub: `${s.netMargin.toFixed(1)}% margin` },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{fmt(k.value)}</p>
              {k.sub && <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Statement table */}
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
                  <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a date range and click Generate</p>
                </td>
              </tr>
            ) : (
              <>
                {/* Revenue */}
                <tr className="bg-emerald-50/50"><td colSpan={3} className="py-2 px-4 text-xs font-bold text-emerald-700 uppercase tracking-wider">Revenue</td></tr>
                <SectionRows rows={data.revenue} />
                <SummaryRow label="TOTAL REVENUE" value={s.totalRevenue} bold />

                {/* COGS */}
                {data.cogs.length > 0 && (
                  <>
                    <tr className="bg-orange-50/50"><td colSpan={3} className="py-2 px-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Cost of Sales</td></tr>
                    <SectionRows rows={data.cogs} />
                    <SummaryRow label="TOTAL COST OF SALES" value={s.totalCOGS} bold />
                    <SummaryRow label="GROSS PROFIT" value={s.grossProfit} bold color={s.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
                  </>
                )}

                {/* Operating Expenses */}
                {data.opex.length > 0 && (
                  <>
                    <tr className="bg-amber-50/50"><td colSpan={3} className="py-2 px-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Operating Expenses</td></tr>
                    <SectionRows rows={data.opex} />
                    <SummaryRow label="TOTAL OPERATING EXPENSES" value={s.totalOpex} bold />
                  </>
                )}

                {/* Net */}
                <tr className={`border-t-2 border-border ${s.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <td className="py-4 px-4 w-20" />
                  <td className="py-4 px-4 font-bold text-base">NET PROFIT / (LOSS)</td>
                  <td className={`py-4 px-4 text-right font-bold text-base font-mono ${s.netProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                    {fmt(s.netProfit)}
                    <span className="ml-2 text-sm font-normal opacity-70">({s.netMargin.toFixed(1)}%)</span>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
