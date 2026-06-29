/**
 * GET /feeds/google-merchant
 * Global Google Merchant Center feed — all active products across all merchants.
 * Cached for 6 hours; Google re-fetches feeds daily.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildGoogleMerchantFeed } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const CACHE_SECONDS = 6 * 60 * 60; // 6 h

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        tenant: { isActive: true, deletedAt: null },
      },
      select: {
        id: true, name: true, description: true, sku: true,
        price: true, currency: true, stockQuantity: true,
        isFeatured: true, metadata: true, createdAt: true, updatedAt: true,
        images: { orderBy: { displayOrder: 'asc' } },
        category: { select: { id: true, name: true } },
        tenant: {
          select: {
            id: true, name: true, subdomain: true, industry: true,
            logoUrl: true, phone: true, email: true, address: true,
            settings: true, defaultCurrency: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50_000,
    });

    const items = products.map((p) => {
      const settings  = (p.tenant.settings as any) ?? {};
      const store = {
        id:          p.tenant.id,
        name:        p.tenant.name,
        subdomain:   p.tenant.subdomain,
        industry:    p.tenant.industry,
        logoUrl:     p.tenant.logoUrl,
        phone:       p.tenant.phone,
        email:       p.tenant.email,
        address:     p.tenant.address,
        city:        settings.city    ?? '',
        state:       settings.state   ?? '',
        country:     settings.country ?? 'NG',
        currency:    p.tenant.defaultCurrency,
        description: settings.description ?? '',
        website:     settings.website ?? '',
      };
      const product = {
        id:            p.id,
        name:          p.name,
        description:   p.description,
        sku:           p.sku,
        price:         Number(p.price),
        currency:      p.currency,
        stockQuantity: p.stockQuantity,
        isFeatured:    p.isFeatured,
        metadata:      p.metadata as Record<string, any>,
        images:        p.images,
        category:      p.category,
        createdAt:     p.createdAt,
        updatedAt:     p.updatedAt,
      };
      return { product, store };
    });

    const xml = buildGoogleMerchantFeed(items, {
      title: 'Shopysh — Google Merchant Feed',
      description: 'All active products from Shopysh marketplace merchants',
    });

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error: any) {
    console.error('[GMC Feed] Error:', error);
    return new NextResponse('Feed generation failed', { status: 500 });
  }
}
