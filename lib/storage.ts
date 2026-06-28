import { stat } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

/** Returns total bytes used by a tenant's uploaded product images on disk. */
export async function getTenantStorageBytes(tenantId: string): Promise<number> {
  const images = await prisma.productImage.findMany({
    where: {
      product: { tenantId, deletedAt: null },
      url: { startsWith: '/uploads/' },
    },
    select: { url: true },
  });

  let total = 0;
  await Promise.all(
    images.map(async (img) => {
      try {
        const s = await stat(path.join(process.cwd(), 'public', img.url));
        total += s.size;
      } catch {
        // file missing — skip
      }
    })
  );
  return total;
}

/** Returns the tenant's storage limit in MB from their active subscription plan (default 1024 MB). */
export async function getTenantStorageLimitMb(tenantId: string): Promise<number> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: { select: { maxStorageMb: true } } },
  });
  return subscription?.plan?.maxStorageMb ?? 1024;
}

export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}
