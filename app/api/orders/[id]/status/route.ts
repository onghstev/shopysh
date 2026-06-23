export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, badRequest, serverError, toNumber } from '@/lib/api-helpers';

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const order = await prisma.order.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: { items: true },
    });
    if (!order) return notFound('Order not found');

    const body = await request.json();
    const newStatus = body?.status;
    if (!newStatus) return badRequest('Status is required');

    const allowedStatuses = STATUS_FLOW[order.status] ?? [];
    if (!allowedStatuses.includes(newStatus)) {
      return badRequest(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updateData: any = { status: newStatus };
    const now = new Date();

    if (newStatus === 'CONFIRMED') updateData.confirmedAt = now;
    if (newStatus === 'OUT_FOR_DELIVERY') updateData.shippedAt = now;
    if (newStatus === 'DELIVERED') updateData.deliveredAt = now;
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = now;
      updateData.cancellationReason = body?.reason ?? null;
      // Restore stock
      for (const item of (order?.items ?? [])) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: { customer: true, items: true },
    });

    return NextResponse.json({
      order: {
        ...updated,
        totalAmount: toNumber(updated?.totalAmount),
        subtotal: toNumber(updated?.subtotal),
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}
