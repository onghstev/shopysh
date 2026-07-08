export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber')?.trim().toUpperCase();
    const phone = searchParams.get('phone')?.trim();

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: 'Order number and phone are required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        tenantId: tenant.id,
        orderNumber,
        customer: { phone },
      },
      include: {
        items: {
          include: { product: { select: { images: { take: 1, orderBy: { displayOrder: 'asc' } } } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found. Please check your order number and phone number.' }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalAmount: Number(i.totalAmount),
          image: i.product?.images?.[0]?.url || null,
        })),
      },
    });
  } catch (error: any) {
    console.error('Track order error:', error);
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}
