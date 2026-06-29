/**
 * Paginated sitemap using Next.js generateSitemaps().
 * Produces a sitemap index at /sitemap.xml with sub-sitemaps per section.
 *
 * Sections:
 *  id=0  → static pages
 *  id=1  → merchant store pages
 *  id=2  → product category pages
 *  id=3+ → products (50,000 per page)
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { BASE_URL, productUrl, storeUrl, categoryUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PRODUCTS_PER_PAGE = 50_000;

// Section id constants
const SEC_STATIC     = 0;
const SEC_MERCHANTS  = 1;
const SEC_CATEGORIES = 2;
const SEC_PRODUCTS   = 3; // 3, 4, 5, … one per page of products

export async function generateSitemaps() {
  try {
    const productCount = await prisma.product.count({
      where: { isActive: true, deletedAt: null, tenant: { isActive: true, deletedAt: null } },
    });
    const productPages = Math.max(1, Math.ceil(productCount / PRODUCTS_PER_PAGE));

    return [
      { id: SEC_STATIC },
      { id: SEC_MERCHANTS },
      { id: SEC_CATEGORIES },
      ...Array.from({ length: productPages }, (_, i) => ({ id: SEC_PRODUCTS + i })),
    ];
  } catch {
    return [{ id: SEC_STATIC }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  try {
    if (id === SEC_STATIC) return buildStaticSitemap();
    if (id === SEC_MERCHANTS) return buildMerchantsSitemap();
    if (id === SEC_CATEGORIES) return buildCategoriesSitemap();
    if (id >= SEC_PRODUCTS) return buildProductsSitemap(id - SEC_PRODUCTS);
  } catch (err) {
    console.error(`[Sitemap] Error generating id=${id}:`, err);
  }
  return [];
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildStaticSitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL,              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/pitch`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/guide`,   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/store`,   lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
}

async function buildMerchantsSitemap(): Promise<MetadataRoute.Sitemap> {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, deletedAt: null },
    select: { subdomain: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return tenants.map((t) => ({
    url: storeUrl(t.subdomain),
    lastModified: t.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));
}

async function buildCategoriesSitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await prisma.productCategory.findMany({
    where: { isActive: true, tenant: { isActive: true, deletedAt: null } },
    select: { id: true, updatedAt: true, tenant: { select: { subdomain: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return categories.map((c) => ({
    url: categoryUrl(c.tenant.subdomain, c.id),
    lastModified: c.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}

async function buildProductsSitemap(page: number): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, tenant: { isActive: true, deletedAt: null } },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      images: { orderBy: { displayOrder: 'asc' }, take: 1, select: { url: true } },
      tenant: { select: { subdomain: true } },
    },
    orderBy: { updatedAt: 'desc' },
    skip: page * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
  });

  return products.map((p) => ({
    url: productUrl(p.tenant.subdomain, p.slug ?? p.id),
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    // Next.js 14 sitemap type doesn't support images natively here;
    // the XML image sitemap is built separately via the image sub-sitemaps.
  }));
}
