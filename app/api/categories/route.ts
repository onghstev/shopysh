export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    // Include the current tenant's categories plus platform-wide categories
    // created by any SUPER_ADMIN tenant, so merchants can assign them to products.
    const superAdminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });
    const superAdminTenantIds = superAdminUsers
      .map((u) => u.tenantId)
      .filter((id): id is string => !!id && id !== session.user.tenantId);

    const categories = await prisma.productCategory.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: session.user.tenantId },
          ...(superAdminTenantIds.length > 0 ? [{ tenantId: { in: superAdminTenantIds } }] : []),
        ],
      },
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ categories: categories ?? [] });
  } catch (error: any) {
    return serverError(error);
  }
}

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
