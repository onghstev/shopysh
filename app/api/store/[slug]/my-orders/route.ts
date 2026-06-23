export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCustomerFromRequest } from '@/lib/customer-auth';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const customerPayload = getCustomerFromRequest(request);
    if (!customerPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!tenant || tenant.id !== customerPayload.tenantId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: customerPayload.customerId, tenantId: tenant.id },
      include: {
        items: {
          include: { product: { select: { name: true, images: { take: 1, orderBy: { displayOrder: 'asc' } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        currency: o.currency,
        paymentStatus: o.paymentStatus,
        deliveryMethod: o.deliveryMethod,
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
        confirmedAt: o.confirmedAt,
        shippedAt: o.shippedAt,
        deliveredAt: o.deliveredAt,
        items: o.items.map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalAmount: Number(i.totalAmount),
          image: i.product?.images?.[0]?.url || null,
        })),
      })),
    });
  } catch (error: any) {
    console.error('My orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
