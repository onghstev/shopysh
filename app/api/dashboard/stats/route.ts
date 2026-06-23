export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError, toNumber } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalProducts, totalCustomers, totalOrders, todayOrders, monthOrders, recentOrders, lowStockProducts, weeklyRevenue] = await Promise.all([
      prisma.product.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      prisma.customer.count({ where: { tenantId, deletedAt: null } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.order.findMany({ where: { tenantId, createdAt: { gte: todayStart } } }),
      prisma.order.findMany({ where: { tenantId, createdAt: { gte: monthStart } } }),
      prisma.order.findMany({
        where: { tenantId },
        include: { customer: { select: { name: true, phone: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.product.findMany({
        where: { tenantId, deletedAt: null, isActive: true, trackInventory: true, stockQuantity: { lte: 10 } },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: weekStart }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    const todayRevenue = todayOrders
      .filter((o: any) => o?.status !== 'CANCELLED' && o?.status !== 'REFUNDED')
      .reduce((sum: number, o: any) => sum + toNumber(o?.totalAmount), 0);

    const monthRevenue = monthOrders
      .filter((o: any) => o?.status !== 'CANCELLED' && o?.status !== 'REFUNDED')
      .reduce((sum: number, o: any) => sum + toNumber(o?.totalAmount), 0);

    // Build daily revenue for last 7 days
    const dailyRevenue: Array<{ date: string; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().slice(0, 10);
      const dayRevenue = weeklyRevenue
        .filter((o: any) => o?.createdAt?.toISOString?.()?.slice?.(0, 10) === dayStr)
        .reduce((sum: number, o: any) => sum + toNumber(o?.totalAmount), 0);
      dailyRevenue.push({ date: dayStr, revenue: dayRevenue });
    }

    // Top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { tenantId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    return NextResponse.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      todayOrders: todayOrders?.length ?? 0,
      todayRevenue,
      monthRevenue,
      recentOrders: (recentOrders ?? []).map((o: any) => ({
        ...o,
        totalAmount: toNumber(o?.totalAmount),
        subtotal: toNumber(o?.subtotal),
        taxAmount: toNumber(o?.taxAmount),
        discountAmount: toNumber(o?.discountAmount),
        shippingFee: toNumber(o?.shippingFee),
      })),
      lowStockProducts: (lowStockProducts ?? []).map((p: any) => ({
        ...p,
        price: toNumber(p?.price),
      })),
      dailyRevenue,
      topProducts: (topProducts ?? []).map((tp: any) => ({
        productId: tp?.productId,
        productName: tp?.productName,
        totalQuantity: tp?._sum?.quantity ?? 0,
        totalRevenue: toNumber(tp?._sum?.totalAmount),
      })),
    });
  } catch (error: any) {
    return serverError(error);
  }
}
