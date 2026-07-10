import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;

  const { searchParams } = new URL(req.url);
  const search    = searchParams.get('search') ?? '';
  const status    = searchParams.get('status') ?? '';   // 'low' | 'out' | ''
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit     = 50;
  const offset    = (page - 1) * limit;

  const where: any = {
    tenantId,
    deletedAt: null,
    trackInventory: true,
  };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (status === 'out') {
    where.stockQuantity = 0;
  } else if (status === 'low') {
    // low = stockQuantity > 0 AND stockQuantity <= lowStockThreshold
    // We can't compare two columns in Prisma where; use rawQuery for summary but
    // for the list we filter in JS after fetching (small dataset per page).
    where.stockQuantity = { gt: 0 };
  }

  let [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, sku: true, stockQuantity: true, lowStockThreshold: true,
        costPrice: true, currency: true, isActive: true,
        category: { select: { id: true, name: true } },
        _count: { select: { stockMovements: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ]);

  // Apply low-stock cross-column filter in JS (Prisma can't compare columns in where)
  if (status === 'low') {
    products = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold ?? 10));
  }

  // Summary stats (all products, not just current page)
  const [lowStock, outOfStock] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM products
      WHERE tenant_id = ${tenantId}::uuid
        AND deleted_at IS NULL
        AND track_inventory = true
        AND stock_quantity > 0
        AND stock_quantity <= low_stock_threshold`,
    prisma.product.count({
      where: { tenantId, deletedAt: null, trackInventory: true, stockQuantity: 0 },
    }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    summary: {
      lowStock:   Number((lowStock[0] as any)?.count ?? 0),
      outOfStock,
    },
  });
}
