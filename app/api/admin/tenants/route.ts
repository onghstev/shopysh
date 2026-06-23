export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const search = searchParams.get('search') ?? '';

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }, { subdomain: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, products: true, orders: true, customers: true } },
          subscriptions: { include: { plan: { select: { name: true } } } },
          users: { where: { role: 'TENANT_ADMIN' }, take: 1, select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants: tenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        industry: t.industry,
        email: t.email,
        phone: t.phone,
        isActive: t.isActive,
        defaultCurrency: t.defaultCurrency,
        createdAt: t.createdAt,
        trialEndsAt: t.trialEndsAt,
        plan: t.subscriptions?.[0]?.plan?.name ?? 'None',
        planStatus: t.subscriptions?.[0]?.status ?? 'N/A',
        adminEmail: t.users?.[0]?.email ?? 'N/A',
        adminName: t.users?.[0] ? `${t.users[0].firstName} ${t.users[0].lastName}` : 'N/A',
        userCount: t._count.users,
        productCount: t._count.products,
        orderCount: t._count.orders,
        customerCount: t._count.customers,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin tenants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
