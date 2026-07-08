export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, badRequest, serverError, toNumber } from '@/lib/api-helpers';
import { postOrderPayment, postOrderCOGS } from '@/lib/accounting/auto-post';

const STATUS_FLOW: Record<string, string[]> = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PROCESSING', 'CANCELLED'],
  PROCESSING:       ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        ['COMPLETED'],
  COMPLETED:        [],
  CANCELLED:        ['REFUNDED'],
  REFUNDED:         [],
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
      const allowed = allowedStatuses.length
        ? `You can only move it to: ${allowedStatuses.join(', ').replace(/_/g, ' ')}.`
        : 'This order is in a final state and cannot be updated.';
      return badRequest(
        `Cannot move order from ${order.status.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}. ${allowed}`
      );
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
      include: { customer: true, items: { include: { product: { select: { costPrice: true } } } } },
    });

    const tenantId = session.user.tenantId;

    // When order is COMPLETED and was cash-on-delivery: post payment to GL
    if (newStatus === 'COMPLETED' && updated.paymentStatus !== 'PAID') {
      await postOrderPayment({
        tenantId,
        orderId: updated.id,
        amount: toNumber(updated.totalAmount),
        currency: updated.currency ?? 'NGN',
        paymentMethod: updated.paymentMethod ?? 'cash',
        description: `Order completed – #${updated.orderNumber}`,
      });
    }

    // When order is COMPLETED or DELIVERED: post COGS if products have cost prices
    if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
      const cogsAmount = (updated.items ?? []).reduce((sum: number, item: any) => {
        const cost = Number(item.product?.costPrice ?? 0);
        return sum + cost * item.quantity;
      }, 0);
      if (cogsAmount > 0) {
        await postOrderCOGS({
          tenantId,
          orderId: updated.id,
          cogsAmount,
          currency: updated.currency ?? 'NGN',
          description: `COGS – Order #${updated.orderNumber}`,
        });
      }
    }

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
