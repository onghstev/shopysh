export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalTenants, activeTenants, totalUsers, totalProducts, totalOrders, totalCustomers, recentTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.tenant.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, products: true, orders: true, customers: true } },
          subscriptions: { include: { plan: { select: { name: true } } } },
        },
      }),
    ]);

    // Revenue stats
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'CANCELLED' } },
    });

    return NextResponse.json({
      stats: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() ?? 0,
      },
      recentTenants: recentTenants.map((t: any) => ({
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
        userCount: t._count.users,
        productCount: t._count.products,
        orderCount: t._count.orders,
        customerCount: t._count.customers,
      })),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
