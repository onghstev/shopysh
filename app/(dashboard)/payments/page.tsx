'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/format';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function PaymentsPage() {
  const { data: session } = useSession() || {};
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (gatewayFilter) params.set('gateway', gatewayFilter);
      const res = await fetch(`/api/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, gatewayFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalRevenue = payments.filter((p: any) => p.status === 'success').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingAmount = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Payments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Received</p><p className="text-xl font-bold">{formatCurrency(totalRevenue, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950"><Clock className="w-5 h-5 text-yellow-600" /></div>
          <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-bold">{formatCurrency(pendingAmount, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950"><CreditCard className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Transactions</p><p className="text-xl font-bold">{total}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={(v: string) => setGatewayFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gateway" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="paystack">Paystack</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No payments found</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.transactionReference}</TableCell>
                    <TableCell>{p.order?.orderNumber ?? '-'}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.paymentGateway}</Badge></TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.amount, p.currency)}</TableCell>
                    <TableCell><Badge className={PAYMENT_STATUS_COLORS[p.status] ?? 'bg-gray-100'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDateTime(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
