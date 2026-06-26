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

    // Delete all related data in FK-safe dependency order (children before parents).
    // Each deleteMany uses the exact Prisma model accessor name from schema.prisma.
    await prisma.$transaction(async (tx: any) => {
      // Leaf records that reference Conversations / Campaigns / Orders / Products
      await tx.campaignMessage.deleteMany({ where: { campaign: { tenantId } } });
      await tx.aIUsageTracking.deleteMany({ where: { tenantId } });
      await tx.message.deleteMany({ where: { conversation: { tenantId } } });
      await tx.conversation.deleteMany({ where: { tenantId } });
      await tx.campaign.deleteMany({ where: { tenantId } });
      await tx.orderItem.deleteMany({ where: { order: { tenantId } } });

      // Finance module (Income references Customer & Tenant; Expense references ExpenseCategory)
      await tx.income.deleteMany({ where: { tenantId } });
      await tx.dailyCashEntry.deleteMany({ where: { tenantId } });
      await tx.expense.deleteMany({ where: { tenantId } });
      await tx.expenseCategory.deleteMany({ where: { tenantId } });
      await tx.bankAccount.deleteMany({ where: { tenantId } });

      // Orders, invoices, payments all have direct tenantId
      await tx.invoice.deleteMany({ where: { tenantId } });
      await tx.payment.deleteMany({ where: { tenantId } });
      await tx.order.deleteMany({ where: { tenantId } });

      // Products & categories (ProductCategory, not Category)
      await tx.productImage.deleteMany({ where: { product: { tenantId } } });
      await tx.product.deleteMany({ where: { tenantId } });
      await tx.productCategory.deleteMany({ where: { tenantId } });

      // Customers & tags
      await tx.customerTag.deleteMany({ where: { tenantId } });
      await tx.customer.deleteMany({ where: { tenantId } });

      // Subscription data
      await tx.subscriptionUsage.deleteMany({ where: { tenantId } });
      await tx.subscription.deleteMany({ where: { tenantId } });

      // WhatsApp config
      await tx.whatsAppConfig.deleteMany({ where: { tenantId } });

      // Nullify access code back-references (keep code records for audit)
      await tx.accessCode.updateMany({
        where: { usedByTenantId: tenantId },
        data: { usedByTenantId: null },
      });

      // Misc tenant-scoped records
      await tx.aIConfig.deleteMany({ where: { tenantId } });
      await tx.promptTemplate.deleteMany({ where: { tenantId } });
      await tx.analyticsEvent.deleteMany({ where: { tenantId } });
      await tx.auditLog.deleteMany({ where: { tenantId } });

      // Users
      await tx.user.deleteMany({ where: { tenantId } });

      // Finally the tenant itself
      await tx.tenant.delete({ where: { id: tenantId } });
    }, { timeout: 30_000 });

    return NextResponse.json({ message: `Tenant "${tenant.name}" and all associated data permanently deleted.` });
  } catch (error: any) {
    console.error('Admin tenant delete error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete tenant' }, { status: 500 });
  }
}
