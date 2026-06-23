import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Recent activity feed for the tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    // Aggregate recent events from various tables
    const [recentOrders, recentCustomers, lowStockProducts, recentConversations] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId },
        select: { id: true, orderNumber: true, status: true, totalAmount: true, currency: true, createdAt: true, customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true, phone: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.product.findMany({
        where: { tenantId, deletedAt: null, isActive: true },
        select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
      }).then(products => products.filter(p => p.stockQuantity <= p.lowStockThreshold)),
      prisma.conversation.findMany({
        where: { tenantId, status: 'active' },
        select: { id: true, status: true, intent: true, lastMessageAt: true, escalatedToHuman: true, customer: { select: { name: true, phone: true } } },
        orderBy: { lastMessageAt: 'desc' },
        take: 5,
      }),
    ]);

    // Build a unified notifications list
    const notifications: any[] = [];

    for (const o of recentOrders) {
      notifications.push({
        id: `order-${o.id}`,
        type: 'order',
        title: `Order ${o.orderNumber}`,
        message: `${o.customer?.name ?? 'Customer'} placed an order - ${o.status}`,
        href: `/orders/${o.id}`,
        createdAt: o.createdAt,
      });
    }

    for (const c of recentCustomers) {
      notifications.push({
        id: `customer-${c.id}`,
        type: 'customer',
        title: 'New Customer',
        message: `${c.name ?? c.phone} joined`,
        href: `/customers/${c.id}`,
        createdAt: c.createdAt,
      });
    }

    for (const p of lowStockProducts) {
      notifications.push({
        id: `lowstock-${p.id}`,
        type: 'alert',
        title: 'Low Stock Alert',
        message: `${p.name} has only ${p.stockQuantity} units left`,
        href: `/products/${p.id}`,
        createdAt: new Date(),
      });
    }

    for (const conv of recentConversations) {
      if (conv.escalatedToHuman) {
        notifications.push({
          id: `escalation-${conv.id}`,
          type: 'escalation',
          title: 'Escalated Conversation',
          message: `${conv.customer?.name ?? conv.customer?.phone ?? 'Customer'} needs human assistance`,
          href: '/conversations',
          createdAt: conv.lastMessageAt ?? new Date(),
        });
      }
    }

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 20), lowStockCount: lowStockProducts.length });
  } catch (error: any) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
