'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, User, Calendar, CreditCard, ShoppingCart, Truck, Printer } from 'lucide-react';
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/format';
import { toast } from 'sonner';
import { printReceipt } from '@/lib/print-receipt';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [biz, setBiz] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/profile').then(r => r.ok ? r.json() : null).then(d => { if (d) setBiz(d.tenant ?? d); }).catch(() => {});
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params?.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data?.order ?? null);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [params?.id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${params?.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success('Order status updated');
        fetchOrder();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? 'Failed to update status');
      }
    } catch (e: any) { console.error(e); toast.error('Error updating status'); } finally { setUpdating(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!order) return <div className="text-center py-20"><p className="text-muted-foreground">Order not found</p><Button asChild className="mt-4"><Link href="/orders">Back to Orders</Link></Button></div>;

  const currency = order?.currency ?? 'NGN';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Order {order?.orderNumber ?? ''}</h1>
          <p className="text-muted-foreground text-sm">{formatDateTime(order?.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge className={ORDER_STATUS_COLORS[order?.status] ?? ''}>{order?.status?.replace?.(/_/g, ' ') ?? ''}</Badge>
          <Button
            variant="outline" size="sm"
            onClick={() => printReceipt({
              receiptNumber: order.orderNumber,
              date: order.createdAt,
              customerName:  order.customer?.name,
              customerPhone: order.customer?.phone,
              customerEmail: order.customer?.email,
              paymentMethod: order.paymentMethod?.replace?.(/_/g, ' '),
              lines: (order.items ?? []).map((it: any) => ({
                description: it.product?.name ?? it.productName ?? 'Item',
                qty: it.quantity,
                unitPrice: Number(it.unitPrice),
                amount: Number(it.totalPrice),
              })),
              subtotal: Number(order.subtotal ?? order.totalAmount),
              discount: Number(order.discount ?? 0),
              tax: Number(order.tax ?? 0),
              total: Number(order.totalAmount),
            }, biz)}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
          </Button>
          {order?.status !== 'COMPLETED' && order?.status !== 'CANCELLED' && (
            <Select value="" onValueChange={updateStatus} disabled={updating}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Update Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.filter((s: string) => s !== order?.status).map((s: string) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(order?.items ?? []).map((item: any) => (
                    <TableRow key={item?.id}>
                      <TableCell className="font-medium">{item?.product?.name ?? item?.productName ?? '-'}</TableCell>
                      <TableCell className="text-right">{item?.quantity ?? 0}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item?.unitPrice, currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item?.totalPrice, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(order?.subtotal, currency)}</span></div>
                {Number(order?.discount ?? 0) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatCurrency(order?.discount, currency)}</span></div>}
                {Number(order?.tax ?? 0) > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(order?.tax, currency)}</span></div>}
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(order?.totalAmount, currency)}</span></div>
              </div>
            </CardContent>
          </Card>
          {order?.notes && (
            <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{order.notes}</p></CardContent></Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order?.customer?.name ?? '-'}</p>
              <p className="text-muted-foreground">{order?.customer?.phone ?? '-'}</p>
              {order?.customer?.email && <p className="text-muted-foreground">{order.customer.email}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Status</span><Badge className={PAYMENT_STATUS_COLORS[order?.paymentStatus] ?? ''}>{order?.paymentStatus ?? '-'}</Badge></div>
              <div className="flex justify-between"><span>Method</span><span>{order?.paymentMethod?.replace?.(/_/g, ' ') ?? '-'}</span></div>
            </CardContent>
          </Card>
          {order?.deliveryAddress && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" />Delivery</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{order.deliveryAddress}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
