'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, BookOpen, FileText, Users2,
  BarChart3, PieChart, Scale, Receipt, ChevronRight, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, Building2, Layers,
  Landmark, CreditCard, UserCheck, UserX, HardDrive, AlertCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

function KpiCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  trend?: 'up' | 'down' | 'flat'; icon: any; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-destructive" />}
            {trend === 'flat' && <Minus className="w-3 h-3 text-muted-foreground" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { href: '/finance/accounts',       label: 'Chart of Accounts', icon: Layers,       desc: 'Manage GL accounts'    },
  { href: '/finance/journal',        label: 'Journal Entries',   icon: BookOpen,     desc: 'Create & post'         },
  { href: '/finance/sales-book',     label: 'Sales Book',        icon: TrendingUp,   desc: 'Sales transactions'    },
  { href: '/finance/purchase-book',  label: 'Purchase Book',     icon: TrendingDown, desc: 'Purchase transactions' },
  { href: '/finance/cash-book',      label: 'Cash Book',         icon: Landmark,     desc: 'Cash ledger'           },
  { href: '/finance/bank-book',      label: 'Bank Book',         icon: CreditCard,   desc: 'Bank ledger'           },
  { href: '/finance/receivables',    label: 'Debtors / AR',      icon: UserCheck,    desc: 'Customer aging'        },
  { href: '/finance/payables',       label: 'Creditors / AP',    icon: UserX,        desc: 'Supplier aging'        },
  { href: '/finance/fixed-assets',   label: 'Fixed Assets',      icon: HardDrive,    desc: 'Asset register'        },
  { href: '/finance/budget',         label: 'Budget',            icon: BarChart3,    desc: 'Budget vs actuals'     },
  { href: '/finance/vendors',        label: 'Vendors',           icon: Building2,    desc: 'Supplier management'   },
  { href: '/finance/reports',        label: 'Reports',           icon: Scale,        desc: 'Financial statements'  },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  POSTED: 'bg-emerald-100 text-emerald-700',
  REVERSED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export default function FinanceDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eodRunning, setEodRunning] = useState(false);
  const [postingMode, setPostingMode] = useState<string>('AUTO');

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, finRes] = await Promise.all([
        fetch('/api/finance/dashboard'),
        fetch('/api/settings/finance'),
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (finRes.ok) { const d = await finRes.json(); setPostingMode(d.glPostingMode ?? 'AUTO'); }
    } finally {
      setLoading(false);
    }
  };

  const runEOD = async () => {
    if (!confirm('Post all DRAFT journal entries now? This will mark them as POSTED and cannot be undone.')) return;
    setEodRunning(true);
    try {
      const res = await fetch('/api/finance/eod', { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        toast.success(`EOD complete: ${d.posted} entries posted${d.errors > 0 ? `, ${d.errors} errors` : ''}`);
        load();
      } else {
        toast.error(d.error || 'EOD process failed');
      }
    } finally { setEodRunning(false); }
  };

  useEffect(() => { load(); }, []);

  const kpis = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const recent = data?.recentJournals ?? [];
  const counts = data?.counts ?? {};
  const overdueAR = data?.overdueAR ?? { count: 0, amount: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Command Center</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Double-entry GL · Real-time balances · Full audit trail</p>
        </div>
        <div className="flex items-center gap-2">
          {postingMode === 'EOD' && (
            <Button size="sm" onClick={runEOD} disabled={eodRunning} className="bg-amber-600 hover:bg-amber-700 text-white">
              {eodRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
              Run End-of-Day Posting
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overdue AR alert */}
      {!loading && overdueAR.count > 0 && (
        <Link href="/finance/receivables"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {overdueAR.count} invoice{overdueAR.count > 1 ? 's' : ''} overdue by 30+ days — {fmt(overdueAR.amount)} outstanding
          </span>
          <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
        </Link>
      )}

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <KpiCard label="Revenue (YTD)"  value={fmt(kpis.totalRevenue ?? 0)}         icon={TrendingUp}   color="bg-emerald-50 text-emerald-600" />
          <KpiCard label="Expenses (YTD)" value={fmt(kpis.totalExpenses ?? 0)}        icon={TrendingDown} color="bg-red-50 text-red-500" />
          <KpiCard
            label="Net Profit"
            value={fmt(kpis.netProfit ?? 0)}
            sub={`${(kpis.profitMargin ?? 0).toFixed(1)}% margin`}
            trend={(kpis.netProfit ?? 0) >= 0 ? 'up' : 'down'}
            icon={PieChart}
            color={(kpis.netProfit ?? 0) >= 0 ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}
          />
          <KpiCard label="Cash Balance"   value={fmt(kpis.cashBalance ?? 0)}         icon={Wallet}       color="bg-sky-50 text-sky-600" />
          <KpiCard label="Receivables"    value={fmt(kpis.arBalance ?? 0)}            icon={Receipt}      color="bg-amber-50 text-amber-600" />
          <KpiCard label="Payables"       value={fmt(kpis.apBalance ?? 0)}            icon={Scale}        color="bg-violet-50 text-violet-600" />
          <KpiCard label="Fixed Assets"   value={fmt(kpis.fixedAssetsNetBook ?? 0)}  icon={HardDrive}    color="bg-teal-50 text-teal-600"
            sub={`${counts.fixedAssets ?? 0} active asset${(counts.fixedAssets ?? 0) !== 1 ? 's' : ''}`} />
        </div>
      )}

      {/* Chart + Recent Journals */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Revenue vs Expenses — 6 Months</h2>
            <Link href="/finance/reports/income-statement" className="text-xs text-primary hover:underline">Full P&L →</Link>
          </div>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend} barSize={16} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} width={58} />
                <Tooltip formatter={(v: number, name: string) => [fmtFull(v), name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="revenue"  name="Revenue"  fill="hsl(168 84% 26%)" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(40 78% 47%)"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Journals</h2>
            <Link href="/finance/journal" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array(4).fill(0).map((_,i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : recent.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No journal entries yet</p>
              <Link href="/finance/journal"><Button size="sm" variant="outline" className="mt-3">Create first entry</Button></Link>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1">
              {recent.map((e: any) => (
                <Link key={e.id} href="/finance/journal"
                  className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">{e.entryNumber}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${STATUS_BADGE[e.status] ?? 'bg-muted text-muted-foreground'}`}>{e.status}</span>
                    </div>
                    <p className="text-xs font-medium truncate">{e.description}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0">{fmt(Number(e.totalDebit))}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
          {(counts.draftJournals ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <Link href="/finance/journal?status=DRAFT" className="text-xs text-amber-600 font-medium hover:underline">
                {counts.draftJournals} draft{counts.draftJournals > 1 ? 's' : ''} pending posting →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Module grid */}
      <div>
        <h2 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Finance Modules</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'GL Accounts',    value: counts.accounts ?? 0,      href: '/finance/accounts',     icon: Layers    },
          { label: 'Vendors',        value: counts.vendors ?? 0,        href: '/finance/vendors',      icon: Building2 },
          { label: 'Fixed Assets',   value: counts.fixedAssets ?? 0,   href: '/finance/fixed-assets', icon: HardDrive },
          { label: 'Draft Entries',  value: counts.draftJournals ?? 0,  href: '/finance/journal',      icon: BookOpen  },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="rounded-2xl border border-border/50 bg-card px-4 py-3 flex items-center justify-between shadow-sm hover:border-primary/30 transition-colors group">
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
