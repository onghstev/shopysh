export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';

/**
 * PATCH /api/categories/[id] — SUPER_ADMIN only.
 * Updates any platform category regardless of which admin tenant owns it.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only platform admins can edit categories' }, { status: 403 });
    }

    const body = await req.json();
    const data: any = {};
    if (body?.name        !== undefined) data.name        = body.name;
    if (body?.description !== undefined) data.description = body.description;
    if (body?.icon        !== undefined) data.icon        = body.icon;
    if (body?.displayOrder !== undefined) data.displayOrder = body.displayOrder;
    if (body?.isActive    !== undefined) data.isActive    = body.isActive;

    const category = await prisma.productCategory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    return serverError(error);
  }
}

/**
 * DELETE /api/categories/[id] — SUPER_ADMIN only.
 * Blocks deletion if any merchant's products are still assigned to this category.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only platform admins can delete categories' }, { status: 403 });
    }

    // Count products across ALL tenants using this category
    const productCount = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${productCount} product${productCount !== 1 ? 's' : ''} across the platform still use this category.` },
        { status: 400 },
      );
    }

    await prisma.productCategory.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
