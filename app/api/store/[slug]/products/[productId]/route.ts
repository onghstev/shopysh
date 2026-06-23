export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public API — no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; productId: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug },
      select: { id: true, name: true, subdomain: true, defaultCurrency: true, logoUrl: true, primaryColor: true, phone: true, email: true, address: true, settings: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.productId, tenantId: tenant.id, isActive: true, deletedAt: null },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: { select: { id: true, name: true, icon: true, description: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const settings = (tenant.settings as any) ?? {};

    // Get related products from same category
    const relatedProducts = product.categoryId
      ? await prisma.product.findMany({
          where: { tenantId: tenant.id, categoryId: product.categoryId, isActive: true, deletedAt: null, id: { not: product.id } },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          take: 4,
        })
      : [];

    return NextResponse.json({
      store: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        currency: tenant.defaultCurrency,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor ?? '#10b981',
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        description: settings.description ?? '',
        city: settings.city ?? '',
        country: settings.country ?? '',
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        currency: product.currency,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        isFeatured: product.isFeatured,
        category: product.category,
        images: product.images.map((img: any) => ({ url: img.url, alt: img.altText ?? product.name, isPrimary: img.isPrimary })),
        createdAt: product.createdAt,
      },
      relatedProducts: relatedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        image: p.images[0]?.url ?? null,
      })),
    });
  } catch (error: any) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
