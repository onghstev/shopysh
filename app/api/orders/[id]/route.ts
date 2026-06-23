export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError, toNumber } from '@/lib/api-helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const order = await prisma.order.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        customer: true,
        items: { include: { product: { select: { name: true, images: { take: 1 } } } } },
      },
    });

    if (!order) return notFound('Order not found');

    return NextResponse.json({
      order: {
        ...order,
        totalAmount: toNumber(order?.totalAmount),
        subtotal: toNumber(order?.subtotal),
        taxAmount: toNumber(order?.taxAmount),
        discountAmount: toNumber(order?.discountAmount),
        shippingFee: toNumber(order?.shippingFee),
        items: (order?.items ?? []).map((item: any) => ({
          ...item,
          unitPrice: toNumber(item?.unitPrice),
          subtotal: toNumber(item?.subtotal),
          totalAmount: toNumber(item?.totalAmount),
        })),
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}
