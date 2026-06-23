'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getCurrencySymbol } from '@/lib/format';

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
  currency?: string;
}

export default function RevenueChart({ data, currency = 'NGN' }: RevenueChartProps) {
  const safeData = (data ?? []).map((d: any) => ({
    date: d?.date ? new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' }) : '',
    revenue: d?.revenue ?? 0,
  }));

  if (safeData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No revenue data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: any) => [`${getCurrencySymbol(currency)}${Number(value)?.toLocaleString?.()}`, 'Revenue']}
          contentStyle={{ fontSize: 11 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 36%)" fill="url(#revenueGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
