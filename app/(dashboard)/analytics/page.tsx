'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShoppingCart, Users, TrendingUp, Bot, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import dynamic from 'next/dynamic';

const AnalyticsCharts = dynamic(() => import('@/components/charts/analytics-charts'), { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading charts...</div> });

export default function AnalyticsPage() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-5 h-24" /></Card>)}</div>
    </div>
  );

  const o = data?.overview ?? {};
  const cm = data?.conversationMetrics ?? {};
  const ai = data?.ai ?? {};
  const custs = data?.customers ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-green-50 dark:bg-green-950"><DollarSign className="w-4 h-4 text-green-600" /></div><span className="text-sm text-muted-foreground">Revenue</span></div>
          <p className="text-2xl font-bold">{formatCurrency(o.totalRevenue ?? 0, currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950"><ShoppingCart className="w-4 h-4 text-blue-600" /></div><span className="text-sm text-muted-foreground">Orders</span></div>
          <p className="text-2xl font-bold">{o.totalOrders ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950"><Target className="w-4 h-4 text-purple-600" /></div><span className="text-sm text-muted-foreground">Conversion</span></div>
          <p className="text-2xl font-bold">{o.conversionRate ?? 0}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950"><TrendingUp className="w-4 h-4 text-orange-600" /></div><span className="text-sm text-muted-foreground">Avg Order</span></div>
          <p className="text-2xl font-bold">{formatCurrency(o.avgOrderValue ?? 0, currency)}</p>
        </CardContent></Card>
      </div>

      <AnalyticsCharts data={data} currency={currency} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Customer Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Customers</span><span className="font-bold">{custs.total ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">New (this period)</span><span className="font-bold text-green-600">+{custs.new ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Returning</span><span className="font-bold">{custs.returning ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Retention Rate</span><span className="font-bold">{custs.total > 0 ? ((custs.returning / custs.total) * 100).toFixed(0) : 0}%</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4" />AI Performance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Conversations</span><span className="font-bold">{cm.total ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Automation Rate</span><span className="font-bold text-green-600">{cm.automationRate ?? 100}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg Response Time</span><span className="font-bold">{cm.avgFirstResponseTime ?? 0}s</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Escalated to Human</span><span className="font-bold">{cm.escalatedCount ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">AI Tokens Used</span><span className="font-bold">{(ai.totalTokens ?? 0).toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
        <CardContent>
          {(data?.topProducts ?? []).length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No product data for this period</p>
          ) : (
            <div className="space-y-3">
              {(data?.topProducts ?? []).map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.category} • {p.totalQuantity} sold</p>
                  </div>
                  <span className="font-bold text-sm">{formatCurrency(p.totalRevenue, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
