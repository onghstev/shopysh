export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError, toNumber } from '@/lib/api-helpers';
import { generateCustomerCode } from '@/lib/generate-code';
import { writeAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
    const search = searchParams.get('search') ?? '';
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };
    if (search) {
      where.OR = [
        { customerCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers: (customers ?? []).map((c: any) => ({
        ...c,
        lifetimeValue: toNumber(c?.lifetimeValue),
        averageOrderValue: toNumber(c?.averageOrderValue),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const body = await request.json();
    if (!body?.phone) return badRequest('Phone number is required');

    const customerCode = await generateCustomerCode(session.user.tenantId);
    const customer = await prisma.customer.create({
      data: {
        tenantId: session.user.tenantId,
        customerCode,
        phone: body.phone,
        name: body?.name ?? null,
        email: body?.email ?? null,
        location: body?.location ?? null,
        segment: body?.segment ?? 'New',
        acquisitionSource: body?.acquisitionSource ?? 'web',
      },
    });

    writeAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? undefined,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer.id,
      summary: `Created customer ${customer.name ?? customer.phone} (${customer.customerCode})`,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}
