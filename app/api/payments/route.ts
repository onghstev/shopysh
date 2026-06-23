export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');

    const where: any = { tenantId };
    if (status) where.status = status;
    if (gateway) where.paymentGateway = gateway;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { order: { select: { orderNumber: true, totalAmount: true, currency: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, page, limit });
  } catch (error: any) {
    return serverError(error);
  }
}
