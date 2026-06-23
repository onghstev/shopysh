export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public API — no auth required
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug },
      select: {
        id: true,
        name: true,
        subdomain: true,
        industry: true,
        logoUrl: true,
        primaryColor: true,
        defaultCurrency: true,
        phone: true,
        email: true,
        address: true,
        settings: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const settings = (tenant.settings as any) ?? {};

    // Get active products with images
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true, deletedAt: null },
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 3 },
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    // Get active categories
    const categories = await prisma.productCategory.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, icon: true, description: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      store: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        industry: tenant.industry,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor ?? '#10b981',
        currency: tenant.defaultCurrency,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        description: settings.description ?? '',
        city: settings.city ?? '',
        state: settings.state ?? '',
        country: settings.country ?? '',
        website: settings.website ?? '',
      },
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        currency: p.currency,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        isFeatured: p.isFeatured,
        category: p.category ? { id: p.category.id, name: p.category.name, icon: p.category.icon } : null,
        images: p.images.map((img: any) => ({ url: img.url, alt: img.altText ?? p.name, isPrimary: img.isPrimary })),
      })),
      categories,
    });
  } catch (error: any) {
    console.error('Store API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
