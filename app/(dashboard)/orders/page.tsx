'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from '@/lib/format';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

export default function OrdersPage() {
  const { data: session } = useSession() || {};
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (status !== 'ALL') params.set('status', status);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data?.orders ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total order{total !== 1 ? 's' : ''}</p>
        </div>
        <Select value={status} onValueChange={(v: string) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s: string) => <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (orders?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders ?? []).map((order: any) => (
                  <TableRow key={order?.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/orders/${order?.id}`}>
                    <TableCell className="font-mono font-medium">{order?.orderNumber ?? '-'}</TableCell>
                    <TableCell>{order?.customer?.name ?? order?.customer?.phone ?? '-'}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${ORDER_STATUS_COLORS[order?.status] ?? ''}`}>{(order?.status ?? '-').replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{order?.paymentStatus ?? '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(order?.totalAmount, order?.currency ?? currency)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(order?.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page}</span>
              <Button variant="outline" size="sm" disabled={orders.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
