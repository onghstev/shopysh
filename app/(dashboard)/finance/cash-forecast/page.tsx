'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fmt  = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtK = (n: number) => new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default function CashForecastPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState('90');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/ai/cash-forecast?days=${days}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const projections: any[]  = data?.dailyProjections ?? [];
  const alerts: any[]       = data?.alerts ?? [];
  const projected: number   = data?.projectedBalance ?? 0;
  const current: number     = data?.currentCashBalance ?? 0;
  const inflows: number     = data?.monthlyInflows ?? 0;
  const outflows: number    = data?.monthlyOutflows ?? 0;
  const netMonthly: number  = inflows - outflows;
  const confidence: string  = data?.confidence ?? 'low';

  // Downsample daily to weekly for chart
  const chartPoints = projections.filter((_: any, i: number) => i % 7 === 0 || i === projections.length - 1);
  const maxVal = Math.max(...chartPoints.map((p: any) => Math.abs(p.projectedCash)), current, 1);
  const minVal = Math.min(...chartPoints.map((p: any) => p.projectedCash), current);
  const range  = maxVal - Math.min(minVal, 0);

  function barHeight(val: number) {
    if (range === 0) return 50;
    return Math.max(2, ((val - Math.min(minVal, 0)) / range) * 100);
  }

  const CONFIDENCE_COLOR: Record<string, string> = {
    high:   'text-emerald-600 bg-emerald-50 border-emerald-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low:    'text-muted-foreground bg-muted border-border',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cash Flow Forecast</h1>
          <p className="text-muted-foreground text-sm">Projected cash position based on your GL history and recurring items</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.map((a: any, i: number) => (
        <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${a.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {a.severity === 'critical'
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span><strong>{a.date}:</strong> {a.message}</span>
        </div>
      ))}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Cash</p>
            <p className="text-2xl font-bold mt-1">₦{fmtK(current)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Projected in {days}d</p>
            <p className={`text-2xl font-bold mt-1 ${projected < 0 ? 'text-red-600' : projected < current ? 'text-amber-600' : 'text-emerald-600'}`}>
              ₦{fmtK(projected)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Monthly Net</p>
            <p className={`text-2xl font-bold mt-1 ${netMonthly >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netMonthly >= 0 ? '+' : ''}₦{fmtK(netMonthly)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Forecast Confidence</p>
            <div className="mt-2">
              <Badge className={`capitalize ${CONFIDENCE_COLOR[confidence]}`}>{confidence}</Badge>
              {confidence === 'low' && <p className="text-xs text-muted-foreground mt-1">Set up recurring journals to improve accuracy</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartPoints.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-semibold text-sm mb-4">Projected Cash Balance</h2>
            <div className="flex items-end gap-1 h-40">
              {/* Current baseline bar */}
              <div className="flex flex-col items-center gap-1 min-w-[28px]">
                <div
                  className="w-5 rounded-t bg-muted border border-border"
                  style={{ height: `${barHeight(current)}%` }}
                  title={`Today: ₦${fmt(current)}`}
                />
                <span className="text-[9px] text-muted-foreground">Now</span>
              </div>
              {chartPoints.map((p: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-t transition-all ${p.projectedCash < 0 ? 'bg-red-400' : p.projectedCash < current * 0.5 ? 'bg-amber-400' : 'bg-primary/60'}`}
                    style={{ height: `${barHeight(p.projectedCash)}%` }}
                    title={`${p.date}: ₦${fmt(p.projectedCash)}${p.note ? ` (${p.note})` : ''}`}
                  />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {new Date(p.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/60 inline-block" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Low (&lt;50% of current)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Deficit</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Avg Monthly Inflows</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-600">₦{fmtK(inflows)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on last 3 months of cash receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm">Avg Monthly Outflows</h3>
            </div>
            <p className="text-3xl font-bold text-red-500">₦{fmtK(outflows)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on last 3 months of cash payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming recurring items */}
      {projections.filter((p: any) => p.note).length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Upcoming Recurring Items
            </h3>
            <div className="space-y-2">
              {projections.filter((p: any) => p.note).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{p.date}</span>
                  <span className={`font-medium ${p.note?.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{p.note}</span>
                  <span className="font-mono text-sm">₦{fmt(p.projectedCash)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 opacity-30" />
          <p>Building forecast…</p>
        </div>
      )}
    </div>
  );
}
