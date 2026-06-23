'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Wallet, Landmark, FileText, PieChart, ArrowRight, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function FinanceOverviewPage() {
  const { data: session } = useSession() || {};
  const currency = session?.user?.tenantCurrency ?? 'NGN';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const res = await fetch(`/api/finance/statements?from=${firstDay}&to=${lastDay}`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const summaryCards = [
    { title: 'Total Income', value: stats?.income?.total || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', href: '/finance/income' },
    { title: 'Total Expenses', value: stats?.expenses?.total || 0, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', href: '/finance/expenses' },
    { title: 'Net Profit', value: stats?.netProfit || 0, icon: DollarSign, color: (stats?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500', bg: (stats?.netProfit || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30', href: '/finance/statements' },
    { title: 'Cash Sales', value: stats?.cashSalesTotal || 0, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', href: '/finance/daily-banking' },
  ];

  const quickLinks = [
    { title: 'Income', desc: 'Record & manage all income', icon: TrendingUp, href: '/finance/income', color: 'from-emerald-500/10 to-emerald-600/5' },
    { title: 'Expenses', desc: 'Track business expenses', icon: TrendingDown, href: '/finance/expenses', color: 'from-red-500/10 to-red-600/5' },
    { title: 'Daily Banking', desc: 'Cash sales, deposits & reconciliation', icon: Landmark, href: '/finance/daily-banking', color: 'from-blue-500/10 to-blue-600/5' },
    { title: 'Invoices', desc: 'Create & manage invoices', icon: FileText, href: '/finance/invoices', color: 'from-amber-500/10 to-amber-600/5' },
    { title: 'Statements', desc: 'P&L and financial reports', icon: PieChart, href: '/finance/statements', color: 'from-purple-500/10 to-purple-600/5' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Financial Management</h1>
        <p className="text-muted-foreground mt-1">Track income, expenses, and manage your business finances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover-lift cursor-pointer group transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                <p className="text-xl font-bold mt-1">
                  {loading ? <span className="animate-pulse bg-muted rounded h-6 w-24 block" /> : formatCurrency(card.value, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Profit Margin */}
      {stats && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Margin (This Month)</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-3xl font-bold ${parseFloat(stats.profitMargin) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stats.profitMargin}%
                  </span>
                  {parseFloat(stats.profitMargin) >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Order Revenue:</span> <span className="font-semibold">{formatCurrency(stats.orderRevenue, currency)}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Bank Deposits:</span> <span className="font-semibold">{formatCurrency(stats.bankDepositsTotal, currency)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.title} href={link.href}>
              <Card className="hover-lift cursor-pointer group transition-all duration-200 hover:shadow-lg h-full">
                <CardContent className="p-5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 ring-1 ring-black/5 dark:ring-white/10`}>
                    <link.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <h3 className="font-semibold text-sm">{link.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
