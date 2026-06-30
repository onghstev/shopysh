/**
 * GET /feeds/[slug]
 * Per-merchant Google Merchant Center feed.
 * [slug] is the merchant's subdomain, e.g. /feeds/demo-store
 * Cached for 6 hours.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildGoogleMerchantFeed } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const CACHE_SECONDS = 6 * 60 * 60;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: slug },
    select: {
      id: true, name: true, subdomain: true, industry: true,
      logoUrl: true, phone: true, email: true, address: true,
      settings: true, defaultCurrency: true, isActive: true,
    },
  });

  if (!tenant || !tenant.isActive) {
    return new NextResponse('Store not found', { status: 404 });
  }

  const settings = (tenant.settings as any) ?? {};
  const store = {
    id:          tenant.id,
    name:        tenant.name,
    subdomain:   tenant.subdomain,
    industry:    tenant.industry,
    logoUrl:     tenant.logoUrl,
    phone:       tenant.phone,
    email:       tenant.email,
    address:     tenant.address,
    city:        settings.city    ?? '',
    state:       settings.state   ?? '',
    country:     settings.country ?? 'NG',
    currency:    tenant.defaultCurrency,
    description: settings.description ?? '',
    website:     settings.website ?? '',
  };

  const rawProducts = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      deletedAt: null,
      NOT: { metadata: { path: ['gmcStatus'], equals: 'rejected' } },
    },
    select: {
      id: true, slug: true, name: true, description: true, sku: true,
      price: true, currency: true, stockQuantity: true,
      isFeatured: true, metadata: true, createdAt: true, updatedAt: true,
      images: { orderBy: { displayOrder: 'asc' } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const items = rawProducts.map((p) => ({
    product: {
      id:            p.id,
      slug:          p.slug,
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
    },
    store,
  }));

  const xml = buildGoogleMerchantFeed(items, {
    store,
    title: `${tenant.name} — Google Merchant Feed`,
    description: `Products from ${tenant.name} on Shopysh`,
  });

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
      'X-Robots-Tag': 'noindex',
    },
  });
}
