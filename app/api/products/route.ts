export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError, toNumber } from '@/lib/api-helpers';
import { writeAuditLog } from '@/lib/audit';
import { checkPlanLimit } from '@/lib/plan-limits';
import { generateProductSlug } from '@/lib/products';
import { gmcStatusFromRisk } from '@/lib/ai-moderation';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const search = searchParams.get('search') ?? '';
    const categoryId = searchParams.get('categoryId');
    const stockStatus = searchParams.get('stockStatus');
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;

    if (stockStatus === 'low') {
      where.trackInventory = true;
      where.stockQuantity = { lte: 10 };
    } else if (stockStatus === 'out') {
      where.stockQuantity = 0;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } }, images: { orderBy: { displayOrder: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: (products ?? []).map((p: any) => ({
        ...p,
        price: toNumber(p?.price),
        costPrice: p?.costPrice ? toNumber(p.costPrice) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { name, description, sku, price, costPrice, currency, stockQuantity, lowStockThreshold, categoryId, trackInventory, isFeatured, gmcModeration } = body ?? {};

    if (!name || price === undefined) return badRequest('Name and price are required');

    const limit = await checkPlanLimit(tenantId, 'products');
    if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 403 });

    const slug = await generateProductSlug(name, tenantId);

    // Build metadata with GMC moderation result if the client provided one
    const metadata: Record<string, any> = {};
    if (gmcModeration) {
      metadata.gmcStatus      = gmcStatusFromRisk(gmcModeration.riskLevel, gmcModeration.savedAnyway ?? false);
      metadata.gmcRiskScore   = gmcModeration.riskScore;
      metadata.gmcFlags       = gmcModeration.flags;
      metadata.gmcFlagDetails = gmcModeration.flagDetails;
      metadata.gmcSuggestion  = gmcModeration.suggestion;
      metadata.gmcReviewedAt  = gmcModeration.reviewedAt;
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name,
        slug,
        description: description ?? null,
        sku: sku ?? null,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        currency: currency ?? 'NGN',
        stockQuantity: parseInt(String(stockQuantity ?? '0'), 10) || 0,
        lowStockThreshold: parseInt(String(lowStockThreshold ?? '10'), 10) || 10,
        categoryId: categoryId ?? null,
        trackInventory: trackInventory ?? true,
        isFeatured: isFeatured ?? false,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      },
      include: { category: true, images: true },
    });

    writeAuditLog({
      tenantId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? undefined,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      summary: `Created product "${product.name}"${product.sku ? ` (SKU: ${product.sku})` : ''}`,
    });

    return NextResponse.json({ product: { ...product, price: toNumber(product?.price), costPrice: product?.costPrice ? toNumber(product.costPrice) : null } }, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}
