import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function toCsvRow(values: (string | number | null | undefined)[]) {
  return values.map(v => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(',');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'orders';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const tenantId = session.user.tenantId;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z');
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    let csv = '';
    let filename = '';

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where: { tenantId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
        include: { customer: { select: { name: true, phone: true, email: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      csv = toCsvRow(['Order Number', 'Date', 'Customer', 'Phone', 'Status', 'Payment Status', 'Subtotal', 'Tax', 'Discount', 'Shipping', 'Total', 'Currency', 'Items', 'Source']) + '\n';
      for (const o of orders) {
        csv += toCsvRow([
          o.orderNumber, new Date(o.createdAt).toISOString().split('T')[0],
          o.customer?.name, o.customer?.phone, o.status, o.paymentStatus,
          o.subtotal.toString(), o.taxAmount.toString(), o.discountAmount.toString(),
          o.shippingFee.toString(), o.totalAmount.toString(), o.currency,
          o.items.length.toString(), o.source,
        ]) + '\n';
      }
      filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'products') {
      const products = await prisma.product.findMany({
        where: { tenantId, deletedAt: null },
        include: { category: { select: { name: true } } },
        orderBy: { name: 'asc' },
        take: 5000,
      });
      csv = toCsvRow(['Name', 'SKU', 'Category', 'Price', 'Cost Price', 'Currency', 'Stock', 'Low Stock Threshold', 'Active', 'Featured']) + '\n';
      for (const p of products) {
        csv += toCsvRow([
          p.name, p.sku, p.category?.name, p.price.toString(), p.costPrice?.toString(),
          p.currency, p.stockQuantity.toString(), p.lowStockThreshold.toString(),
          p.isActive ? 'Yes' : 'No', p.isFeatured ? 'Yes' : 'No',
        ]) + '\n';
      }
      filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'customers') {
      const customers = await prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      csv = toCsvRow(['Name', 'Phone', 'Email', 'Location', 'Segment', 'Total Orders', 'Lifetime Value', 'Last Order', 'Created']) + '\n';
      for (const c of customers) {
        csv += toCsvRow([
          c.name, c.phone, c.email, c.location, c.segment,
          c.totalOrders.toString(), c.lifetimeValue.toString(),
          c.lastOrderAt ? new Date(c.lastOrderAt).toISOString().split('T')[0] : '',
          new Date(c.createdAt).toISOString().split('T')[0],
        ]) + '\n';
      }
      filename = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { tenantId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      csv = toCsvRow(['Reference', 'Date', 'Amount', 'Currency', 'Gateway', 'Status', 'Payer Email', 'Paid At']) + '\n';
      for (const p of payments) {
        csv += toCsvRow([
          p.transactionReference, new Date(p.createdAt).toISOString().split('T')[0],
          p.amount.toString(), p.currency, p.paymentGateway, p.status,
          p.payerEmail, p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : '',
        ]) + '\n';
      }
      filename = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Reports export error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
