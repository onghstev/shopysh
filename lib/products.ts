/**
 * Product utilities — slug generation with per-tenant uniqueness.
 */

import { prisma } from './db';
import { slugify } from './seo';

/**
 * Generate a URL-safe slug from a product name that is unique within the
 * tenant.  If the base slug is already taken by another product, appends
 * a numeric suffix (-2, -3, …).
 *
 * @param name         Product name to slugify
 * @param tenantId     Tenant scope for uniqueness check
 * @param excludeId    Product ID to exclude (pass when updating an existing product)
 */
export async function generateProductSlug(
  name: string,
  tenantId: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(name) || 'product';

  let candidate = base;
  let suffix = 2;

  while (true) {
    const conflict = await prisma.product.findFirst({
      where: {
        tenantId,
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!conflict) return candidate;

    candidate = `${base}-${suffix}`;
    suffix++;
  }
}
