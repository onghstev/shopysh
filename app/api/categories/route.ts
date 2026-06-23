export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const categories = await prisma.productCategory.findMany({
      where: { tenantId: session.user.tenantId, isActive: true },
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
