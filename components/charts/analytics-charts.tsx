'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/format';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  OUT_FOR_DELIVERY: '#06b6d4',
  DELIVERED: '#10b981',
  COMPLETED: '#059669',
  CANCELLED: '#ef4444',
  REFUNDED: '#f97316',
};

export default function AnalyticsCharts({ data, currency }: { data: any; currency: string }) {
  const revenueData = data?.revenueByDay ?? [];
  const statusData = data?.statusDistribution ?? [];
  const paymentData = data?.paymentMethods ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No revenue data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']} labelFormatter={(label: string) => `Date: ${label}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader><CardTitle className="text-base">Order Status Distribution</CardTitle></CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No order data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="status" label={({ name, value }: any) => `${name}: ${value}`}>
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
        <CardContent>
          {paymentData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No payment data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="method" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value, currency) : value, name === 'revenue' ? 'Revenue' : 'Count']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
