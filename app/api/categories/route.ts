export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';

/** Return IDs of all tenants that have at least one SUPER_ADMIN user. */
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
 * Returns only platform-wide categories owned by SUPER_ADMIN tenants.
 * All users (merchants and admins) see the same shared list.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    // Super Admin sees ALL categories across every tenant (so they can manage
    // categories previously created by merchants before central management).
    // Merchants see only categories owned by Super Admin tenants.
    let whereClause: any = { isActive: true };
    if (!isSuperAdmin) {
      const superAdminTenantIds = await getSuperAdminTenantIds();
      if (superAdminTenantIds.length > 0) {
        whereClause.tenantId = { in: superAdminTenantIds };
      }
    }

    const categories = await prisma.productCategory.findMany({
      where: whereClause,
      include: { children: true, _count: { select: { products: true } } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ categories: categories ?? [] });
  } catch (error: any) {
    return serverError(error);
  }
}

/**
 * POST /api/categories — SUPER_ADMIN only.
 * Creates a platform-wide category under the admin's tenant.
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
