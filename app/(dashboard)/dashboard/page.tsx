'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, DollarSign, ArrowUpRight, Sparkles, Shield, ArrowRight, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from '@/lib/format';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import('@/components/charts/revenue-chart'), { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div> });

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currency = session?.user?.tenantCurrency ?? 'NGN';
  const displayName = session?.user?.firstName ?? session?.user?.name ?? 'there';

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) setStats(await res.json());
    } catch (e: any) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const statCards = [
    { title: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', gradient: 'stat-card-blue', trend: null },
    { title: 'Today Revenue', value: formatCurrency(stats?.todayRevenue ?? 0, currency), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', gradient: 'stat-card-green', trend: null },
    { title: 'Month Revenue', value: formatCurrency(stats?.monthRevenue ?? 0, currency), icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', gradient: 'stat-card-purple', trend: null },
    { title: 'Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'text-orange-600 dark:text-orange-400', gradient: 'stat-card-orange', trend: null },
    { title: 'Customers', value: stats?.totalCustomers ?? 0, icon: Users, color: 'text-teal-600 dark:text-teal-400', gradient: 'stat-card-teal', trend: null },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-[340px] rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Banner */}
      {session?.user?.role === 'SUPER_ADMIN' && (
        <Link href="/admin" className="block">
          <div className="rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-4 text-white flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Platform Admin Panel</p>
                <p className="text-white/80 text-sm">View all registered companies, users, and platform statistics</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Link>
      )}

      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-5 py-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base lg:text-lg font-display font-bold leading-snug">Welcome back, {displayName}! 👋</h1>
              <p className="text-white/65 text-xs hidden sm:block">Manage orders, track revenue, and let AI handle your customer conversations.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur h-8 text-xs">
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur h-8 text-xs">
              <Link href="/ai-assistant">AI Assistant</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className={`${card.gradient} border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 shadow-sm flex items-center justify-center`}>
                  <card.icon className={`w-[18px] h-[18px] ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days performance</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs h-8">
              <Link href="/analytics" className="flex items-center gap-1">
                Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart data={stats?.dailyRevenue ?? []} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <Link href="/orders" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {(stats?.recentOrders?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">New orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(stats?.recentOrders ?? []).map((order: any) => (
                  <Link key={order?.id} href={`/orders/${order?.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{order?.orderNumber ?? '-'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order?.customer?.name ?? order?.customer?.phone ?? '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{formatCurrency(order?.totalAmount, order?.currency)}</p>
                      <Badge variant="secondary" className={`text-[10px] mt-1 ${ORDER_STATUS_COLORS[order?.status] ?? ''}`}>{order?.status ?? '-'}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Shopping Status */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Google Shopping Status
            </CardTitle>
            <Link href="/products" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View products <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status summary pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/60 px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Eligible</p>
                  <p className="text-lg font-bold font-mono text-green-700">{stats?.gmcStatusCounts?.approved ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Flagged</p>
                  <p className="text-lg font-bold font-mono text-amber-700">{stats?.gmcStatusCounts?.flagged ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/60 px-3 py-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Excluded</p>
                  <p className="text-lg font-bold font-mono text-red-700">{stats?.gmcStatusCounts?.rejected ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Not reviewed</p>
                  <p className="text-lg font-bold font-mono text-muted-foreground">{stats?.gmcStatusCounts?.unchecked ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Actionable flagged items */}
            {(stats?.flaggedProducts?.length ?? 0) > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Needs attention</p>
                {(stats?.flaggedProducts ?? []).map((p: any) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.gmcStatus === 'rejected'
                        ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <p className="text-sm truncate group-hover:text-primary transition-colors">{p.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      {(p.flags ?? []).slice(0, 2).map((f: string) => (
                        <span key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">{f.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (stats?.gmcStatusCounts?.unchecked ?? 0) === (stats?.totalProducts ?? 0) ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Edit your products to run AI content review
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700 py-1">
                <CheckCircle2 className="w-4 h-4" />
                All reviewed products are Google Shopping eligible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              </div>
              Low Stock Alerts
            </CardTitle>
            <Link href="/products?stockStatus=low" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {(stats?.lowStockProducts?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">All products well stocked</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Low stock items will be flagged here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(stats?.lowStockProducts ?? []).map((product: any) => (
                  <div key={product?.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/40 dark:border-orange-800/20">
                    <div>
                      <p className="font-medium text-sm">{product?.name ?? '-'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product?.sku ?? '-'}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs font-mono">{product?.stockQuantity ?? 0} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
