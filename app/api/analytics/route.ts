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
    const period = searchParams.get('period') ?? '30'; // days
    const days = parseInt(period);
    const since = new Date(Date.now() - days * 86400000);

    // Revenue over time
    const orders = await prisma.order.findMany({
      where: { tenantId, createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, currency: true, status: true, paymentStatus: true, createdAt: true, source: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group revenue by day
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    for (const o of orders) {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(o.totalAmount);
      ordersByDay[day] = (ordersByDay[day] ?? 0) + 1;
    }

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { tenantId, createdAt: { gte: since }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    });

    // Sales by category
    const productIds = topProducts.map((p: any) => p.productId);
    const productsWithCategories = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } } },
    });
    const categoryMap: Record<string, string> = {};
    for (const p of productsWithCategories) {
      categoryMap[p.id] = p.category?.name ?? 'Uncategorized';
    }

    // Order status distribution
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId, createdAt: { gte: since } },
      _count: { id: true },
    });

    // Payment method distribution
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { tenantId, createdAt: { gte: since }, paymentStatus: 'PAID' },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Customer metrics
    const [totalCustomers, newCustomers, returningCustomers] = await Promise.all([
      prisma.customer.count({ where: { tenantId, deletedAt: null } }),
      prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: since } } }),
      prisma.customer.count({ where: { tenantId, deletedAt: null, totalOrders: { gte: 2 } } }),
    ]);

    // AI metrics
    const aiUsage = await prisma.aIUsageTracking.aggregate({
      where: { tenantId, createdAt: { gte: since } },
      _sum: { totalTokens: true, costUsd: true },
      _count: { id: true },
      _avg: { responseTimeMs: true },
    });

    // Conversation metrics
    const conversations = await prisma.conversation.aggregate({
      where: { tenantId, createdAt: { gte: since } },
      _count: { id: true },
      _avg: { firstResponseTimeSeconds: true, resolutionTimeSeconds: true },
    });

    const escalatedCount = await prisma.conversation.count({
      where: { tenantId, createdAt: { gte: since }, escalatedToHuman: true },
    });

    const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.totalAmount), 0);
    const paidOrders = orders.filter((o: any) => o.paymentStatus === 'PAID');
    const conversionRate = orders.length > 0 ? (paidOrders.length / orders.length * 100).toFixed(1) : '0';
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return NextResponse.json({
      overview: { totalRevenue, totalOrders: orders.length, avgOrderValue, conversionRate: parseFloat(conversionRate) },
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue, orders: ordersByDay[date] ?? 0 })),
      topProducts: topProducts.map((p: any) => ({
        productId: p.productId,
        productName: p.productName,
        category: categoryMap[p.productId] ?? 'Uncategorized',
        totalQuantity: p._sum?.quantity ?? 0,
        totalRevenue: Number(p._sum?.totalAmount ?? 0),
      })),
      statusDistribution: statusCounts.map((s: any) => ({ status: s.status, count: s._count?.id ?? 0 })),
      paymentMethods: paymentMethods.map((p: any) => ({ method: p.paymentMethod ?? 'Unknown', count: p._count?.id ?? 0, revenue: Number(p._sum?.totalAmount ?? 0) })),
      customers: { total: totalCustomers, new: newCustomers, returning: returningCustomers },
      ai: {
        totalConversations: aiUsage._count?.id ?? 0,
        totalTokens: aiUsage._sum?.totalTokens ?? 0,
        totalCost: Number(aiUsage._sum?.costUsd ?? 0),
        avgResponseTime: Math.round(aiUsage._avg?.responseTimeMs ?? 0),
      },
      conversationMetrics: {
        total: conversations._count?.id ?? 0,
        avgFirstResponseTime: Math.round(conversations._avg?.firstResponseTimeSeconds ?? 0),
        avgResolutionTime: Math.round(conversations._avg?.resolutionTimeSeconds ?? 0),
        escalatedCount,
        automationRate: (conversations._count?.id ?? 0) > 0
          ? ((1 - escalatedCount / (conversations._count?.id ?? 1)) * 100).toFixed(1)
          : '100',
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}
