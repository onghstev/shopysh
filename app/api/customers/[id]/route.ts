export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError, toNumber } from '@/lib/api-helpers';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const existing = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
    });
    if (!existing) return notFound('Customer not found');

    await prisma.customer.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        tags: true,
      },
    });

    if (!customer) return notFound('Customer not found');

    return NextResponse.json({
      customer: {
        ...customer,
        lifetimeValue: toNumber(customer?.lifetimeValue),
        averageOrderValue: toNumber(customer?.averageOrderValue),
        orders: (customer?.orders ?? []).map((o: any) => ({
          ...o,
          totalAmount: toNumber(o?.totalAmount),
          subtotal: toNumber(o?.subtotal),
        })),
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const existing = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
    });
    if (!existing) return notFound('Customer not found');

    const body = await request.json();
    const data: any = {};
    if (body?.name !== undefined) data.name = body.name;
    if (body?.email !== undefined) data.email = body.email;
    if (body?.phone !== undefined) data.phone = body.phone;
    if (body?.location !== undefined) data.location = body.location;
    if (body?.segment !== undefined) data.segment = body.segment;
    if (body?.notes !== undefined) data.notes = body.notes;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      customer: { ...customer, lifetimeValue: toNumber(customer?.lifetimeValue) },
    });
  } catch (error: any) {
    return serverError(error);
  }
}
