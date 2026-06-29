/**
 * One-time script: generate slugs for all existing products that have slug = null.
 *
 * Run on the VPS after deploying the new code:
 *   docker exec -it shopysh-app-1 npx tsx scripts/backfill-product-slugs.ts
 *
 * Or locally:
 *   DATABASE_URL="postgresql://shopysh:shopysh_local@localhost:5433/shopysh?schema=public" \
 *   npx tsx scripts/backfill-product-slugs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function generateUniqueSlug(
  name: string,
  tenantId: string,
  productId: string,
): Promise<string> {
  const base = slugify(name) || 'product';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const conflict = await prisma.product.findFirst({
      where: { tenantId, slug: candidate, id: { not: productId } },
      select: { id: true },
    });
    if (!conflict) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true, tenantId: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${products.length} products without a slug.`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const slug = await generateUniqueSlug(product.name, product.tenantId, product.id);
      await prisma.product.update({ where: { id: product.id }, data: { slug } });
      console.log(`  ✓  ${product.id}  →  ${slug}`);
      updated++;
    } catch (err) {
      console.error(`  ✗  ${product.id}  (${product.name}):`, err);
      failed++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${failed} failed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
