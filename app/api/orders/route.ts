export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, badRequest, serverError, generateOrderNumber, toNumber } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: (orders ?? []).map((o: any) => ({
        ...o,
        totalAmount: toNumber(o?.totalAmount),
        subtotal: toNumber(o?.subtotal),
        taxAmount: toNumber(o?.taxAmount),
        discountAmount: toNumber(o?.discountAmount),
        shippingFee: toNumber(o?.shippingFee),
        items: (o?.items ?? []).map((item: any) => ({
          ...item,
          unitPrice: toNumber(item?.unitPrice),
          subtotal: toNumber(item?.subtotal),
          totalAmount: toNumber(item?.totalAmount),
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { customerId, items, notes, deliveryMethod, deliveryAddress, deliveryPhone, paymentMethod, currency, shippingFee, taxAmount, discountAmount } = body ?? {};

    if (!customerId || !items?.length) return badRequest('Customer and items are required');

    const orderNumber = generateOrderNumber();

    const result = await prisma.$transaction(async (tx: any) => {
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, deletedAt: null },
        });
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const qty = item.quantity ?? 1;
        if (product.trackInventory && product.stockQuantity < qty) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const unitPrice = toNumber(product.price);
        const itemSubtotal = unitPrice * qty;
        const itemDiscount = item.discount ?? 0;
        const itemTotal = itemSubtotal - itemDiscount;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: qty,
          unitPrice,
          subtotal: itemSubtotal,
          discountAmount: itemDiscount,
          totalAmount: itemTotal,
          currency: product.currency,
        });

        subtotal += itemTotal;

        if (product.trackInventory) {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: qty } },
          });
        }
      }

      const tax = taxAmount ?? 0;
      const discount = discountAmount ?? 0;
      const shipping = shippingFee ?? 0;
      const totalAmount = subtotal + tax - discount + shipping;

      const order = await tx.order.create({
        data: {
          tenantId,
          customerId,
          orderNumber,
          status: 'PENDING',
          subtotal,
          taxAmount: tax,
          discountAmount: discount,
          shippingFee: shipping,
          totalAmount,
          currency: currency ?? 'NGN',
          paymentMethod: paymentMethod ?? null,
          paymentStatus: 'PENDING',
          deliveryMethod: deliveryMethod ?? null,
          deliveryAddress: deliveryAddress ?? null,
          deliveryPhone: deliveryPhone ?? null,
          notes: notes ?? null,
          source: 'web',
          items: { create: orderItems },
        },
        include: { customer: true, items: true },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          lifetimeValue: { increment: totalAmount },
          lastOrderAt: new Date(),
        },
      });

      return order;
    });

    return NextResponse.json({
      order: {
        ...result,
        totalAmount: toNumber(result?.totalAmount),
        subtotal: toNumber(result?.subtotal),
      },
    }, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}
