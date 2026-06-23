import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.shopysh.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pitch`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    // Get all active tenants with their stores
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, deletedAt: null },
      select: { subdomain: true, updatedAt: true },
    });

    const storePages: MetadataRoute.Sitemap = tenants.map((t: any) => ({
      url: `${baseUrl}/store/${t.subdomain}`,
      lastModified: t.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null, tenant: { isActive: true, deletedAt: null } },
      select: { id: true, updatedAt: true, tenant: { select: { subdomain: true } } },
    });

    const productPages: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${baseUrl}/store/${p.tenant.subdomain}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...storePages, ...productPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
