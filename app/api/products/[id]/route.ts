export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError, toNumber } from '@/lib/api-helpers';
import { generateProductSlug } from '@/lib/products';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      include: { category: true, images: { orderBy: { displayOrder: 'asc' } } },
    });

    if (!product) return notFound('Product not found');

    return NextResponse.json({
      product: { ...product, price: toNumber(product?.price), costPrice: product?.costPrice ? toNumber(product.costPrice) : null },
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
    });
    if (!existing) return notFound('Product not found');

    const body = await request.json();
    const data: any = {};
    if (body?.name !== undefined) {
      data.name = body.name;
      // Regenerate slug when the name changes so the URL stays descriptive.
      // Old UUID URLs will still 301-redirect to the new slug automatically.
      data.slug = await generateProductSlug(body.name, existing.tenantId, params.id);
    }
    if (body?.description !== undefined) data.description = body.description;
    if (body?.sku !== undefined) data.sku = body.sku;
    if (body?.price !== undefined) data.price = parseFloat(body.price);
    if (body?.costPrice !== undefined) data.costPrice = body.costPrice ? parseFloat(body.costPrice) : null;
    if (body?.currency !== undefined) data.currency = body.currency;
    if (body?.stockQuantity !== undefined) data.stockQuantity = parseInt(body.stockQuantity);
    if (body?.lowStockThreshold !== undefined) data.lowStockThreshold = parseInt(body.lowStockThreshold);
    if (body?.categoryId !== undefined) data.categoryId = body.categoryId || null;
    if (body?.trackInventory !== undefined) data.trackInventory = body.trackInventory;
    if (body?.isFeatured !== undefined) data.isFeatured = body.isFeatured;
    if (body?.isActive !== undefined) data.isActive = body.isActive;

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: { category: true, images: { orderBy: { displayOrder: 'asc' } } },
    });

    return NextResponse.json({ product: { ...product, price: toNumber(product?.price), costPrice: product?.costPrice ? toNumber(product.costPrice) : null } });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
    });
    if (!existing) return notFound('Product not found');

    await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: any) {
    return serverError(error);
  }
}
