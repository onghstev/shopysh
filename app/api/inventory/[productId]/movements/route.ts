import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — movement history for a product
export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;

  const product = await prisma.product.findFirst({
    where: { id: params.productId, tenantId, deletedAt: null },
    select: { id: true, name: true, sku: true, stockQuantity: true, lowStockThreshold: true },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, productId: params.productId },
    include: { createdBy: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ product, movements });
}

// POST — record a stock movement and update product stockQuantity
export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const userId   = session.user.id as string | undefined;

  const body = await req.json();
  const { type, quantity: rawQty, reason, reference, costPrice } = body;

  const VALID_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  const qty = parseInt(rawQty, 10);
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: params.productId, tenantId, deletedAt: null },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Calculate new stock
  let newStock: number;
  if (type === 'IN')          newStock = product.stockQuantity + qty;
  else if (type === 'OUT')    newStock = product.stockQuantity - qty;
  else /* ADJUSTMENT */       newStock = qty;   // for ADJUSTMENT, quantity IS the new balance

  if (newStock < 0) {
    return NextResponse.json({ error: `Stock cannot go negative. Current: ${product.stockQuantity}, requested OUT: ${qty}` }, { status: 422 });
  }

  // For ADJUSTMENT the movement qty stored is the delta
  const movementQty = type === 'ADJUSTMENT' ? newStock - product.stockQuantity : qty;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        tenantId,
        productId: params.productId,
        type,
        quantity: movementQty,
        balanceAfter: newStock,
        reason:    reason    || null,
        reference: reference || null,
        costPrice: costPrice  ? costPrice  : null,
        createdById: userId || null,
      },
    }),
    prisma.product.update({
      where: { id: params.productId },
      data:  { stockQuantity: newStock },
    }),
  ]);

  return NextResponse.json({ movement, newStock });
}
