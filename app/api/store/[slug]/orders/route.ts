export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug, isActive: true, deletedAt: null },
      select: {
        id: true, name: true, defaultCurrency: true, phone: true,
        bankAccounts: {
          where: { isActive: true },
          select: { bankName: true, accountName: true, accountNumber: true, currency: true },
          take: 3,
        },
      },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    const { items, customer: customerInfo } = body ?? {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }
    if (!customerInfo?.name || !customerInfo?.phone) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: customerInfo.phone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          phone: customerInfo.phone,
          name: customerInfo.name,
          email: customerInfo.email || null,
          location: customerInfo.address || null,
          acquisitionSource: 'storefront',
          segment: 'New',
          lastInteractionAt: new Date(),
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastInteractionAt: new Date(), name: customerInfo.name },
      });
    }

    // Validate products and calculate totals
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId: tenant.id, isActive: true, deletedAt: null },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.stockQuantity !== null && product.stockQuantity < (item.quantity || 1)) {
        return NextResponse.json({ error: `${product.name} is out of stock or insufficient quantity` }, { status: 400 });
      }
      const qty = item.quantity || 1;
      const unitPrice = Number(product.price);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku || null,
        quantity: qty,
        unitPrice,
        subtotal: itemTotal,
        discountAmount: 0,
        totalAmount: itemTotal,
        currency: product.currency || tenant.defaultCurrency,
      });
    }

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        orderNumber: generateOrderNumber(),
        status: 'PENDING',
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount: subtotal,
        currency: tenant.defaultCurrency,
        paymentStatus: 'PENDING',
        paymentMethod: customerInfo.paymentMethod || 'bank_transfer',
        deliveryMethod: customerInfo.deliveryMethod || 'delivery',
        deliveryAddress: customerInfo.address || null,
        deliveryPhone: customerInfo.phone,
        notes: customerInfo.notes || null,
        source: 'storefront',
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    // Update customer stats
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOrders: { increment: 1 },
        lifetimeValue: { increment: subtotal },
        lastOrderAt: new Date(),
      },
    });

    const paymentMethod = customerInfo.paymentMethod || 'bank_transfer';

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      totalAmount: subtotal,
      currency: order.currency,
      paymentMethod,
      storePhone: tenant.phone ?? null,
      bankAccounts: paymentMethod === 'bank_transfer' ? (tenant.bankAccounts ?? []) : [],
      message: paymentMethod === 'pay_on_delivery'
        ? 'Order placed! The store will contact you to confirm delivery.'
        : paymentMethod === 'bank_transfer'
          ? 'Order reserved! Please complete your bank transfer to confirm it.'
          : 'Order reserved! Please send your mobile money payment to confirm it.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Storefront order error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
