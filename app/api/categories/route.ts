export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';

async function getSuperAdminTenantIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { tenantId: true },
    distinct: ['tenantId'],
  });
  return rows.map((r) => r.tenantId).filter((id): id is string => !!id);
}

/**
 * GET /api/categories
 * Returns top-level categories with their sub-categories nested inside `children`.
 * Each item includes a `_count.products` for its own direct products.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    let tenantFilter: any = {};
    if (!isSuperAdmin) {
      const superAdminTenantIds = await getSuperAdminTenantIds();
      if (superAdminTenantIds.length > 0) {
        tenantFilter = { tenantId: { in: superAdminTenantIds } };
      }
    }

    // Return only top-level categories; sub-categories come via `children`
    const categories = await prisma.productCategory.findMany({
      where: { ...tenantFilter, isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          include: { _count: { select: { products: true } } },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ categories: categories ?? [] });
  } catch (error: any) {
    return serverError(error);
  }
}

/**
 * POST /api/categories — SUPER_ADMIN only.
 * Pass `parentId` to create a sub-category.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only platform admins can create categories' }, { status: 403 });
    }

    const body = await request.json();
    if (!body?.name) return badRequest('Category name is required');

    const category = await prisma.productCategory.create({
      data: {
        tenantId: session.user.tenantId,
        name: body.name,
        description: body?.description ?? null,
        icon: body?.icon ?? null,
        parentId: body?.parentId ?? null,
        displayOrder: body?.displayOrder ?? 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}
