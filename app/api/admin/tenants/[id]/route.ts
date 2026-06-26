export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isActive } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Admin tenant update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Delete all related data in dependency order (children before parents)
    await prisma.$transaction(async (tx: any) => {
      // 1. Campaign messages
      await tx.campaignMessage.deleteMany({ where: { campaign: { tenantId } } });

      // 2. AI usage tracking
      await tx.aIUsageTracking.deleteMany({ where: { tenantId } });

      // 3. Messages (inside conversations)
      await tx.message.deleteMany({ where: { conversation: { tenantId } } });

      // 4. Conversations
      await tx.conversation.deleteMany({ where: { tenantId } });

      // 5. Campaigns
      await tx.campaign.deleteMany({ where: { tenantId } });

      // 6. Order items
      await tx.orderItem.deleteMany({ where: { order: { tenantId } } });

      // 7. Orders
      await tx.order.deleteMany({ where: { tenantId } });

      // 8. Product images
      await tx.productImage.deleteMany({ where: { product: { tenantId } } });

      // 9. Products
      await tx.product.deleteMany({ where: { tenantId } });

      // 10. Categories
      await tx.category.deleteMany({ where: { tenantId } });

      // 11. Customer tags
      await tx.customerTag.deleteMany({ where: { tenantId } });

      // 12. Customers
      await tx.customer.deleteMany({ where: { tenantId } });

      // 13. Subscription usage + payments + invoices
      await tx.subscriptionUsage.deleteMany({ where: { tenantId } });
      await tx.payment.deleteMany({ where: { subscription: { tenantId } } });
      await tx.invoice.deleteMany({ where: { tenantId } });

      // 14. Subscription
      await tx.subscription.deleteMany({ where: { tenantId } });

      // 15. Access codes used by this tenant (nullify, not delete — code history stays)
      await tx.accessCode.updateMany({
        where: { usedByTenantId: tenantId },
        data: { usedByTenantId: null },
      });

      // 16. AI config, prompt templates, analytics, audit logs
      await tx.aIConfig.deleteMany({ where: { tenantId } });
      await tx.promptTemplate.deleteMany({ where: { tenantId } });
      await tx.analyticsEvent.deleteMany({ where: { tenantId } });
      await tx.auditLog.deleteMany({ where: { tenantId } });

      // 17. Users
      await tx.user.deleteMany({ where: { tenantId } });

      // 18. Finally, the tenant itself
      await tx.tenant.delete({ where: { id: tenantId } });
    }, { timeout: 30_000 });

    return NextResponse.json({ message: `Tenant "${tenant.name}" and all associated data permanently deleted.` });
  } catch (error: any) {
    console.error('Admin tenant delete error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete tenant' }, { status: 500 });
  }
}
