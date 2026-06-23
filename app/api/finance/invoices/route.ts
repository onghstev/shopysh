export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${date}-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    const totals = await prisma.invoice.aggregate({ where, _sum: { totalAmount: true } });
    const paidTotal = await prisma.invoice.aggregate({ where: { ...where, status: 'paid' }, _sum: { totalAmount: true } });
    const pendingTotal = await prisma.invoice.aggregate({ where: { ...where, status: 'pending' }, _sum: { totalAmount: true } });

    return NextResponse.json({ items, total, page, pageSize, totalAmount: totals._sum.totalAmount || 0, paidTotal: paidTotal._sum.totalAmount || 0, pendingTotal: pendingTotal._sum.totalAmount || 0 });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { customerId, invoiceType, subtotal, taxAmount, discountAmount, totalAmount, dueDate, notes, items } = body;

    if (!customerId || !totalAmount) return badRequest('Customer and total amount are required');

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId,
        invoiceNumber: generateInvoiceNumber(),
        invoiceType: invoiceType || 'standard',
        subtotal: parseFloat(subtotal || totalAmount),
        taxAmount: parseFloat(taxAmount || '0'),
        discountAmount: parseFloat(discountAmount || '0'),
        totalAmount: parseFloat(totalAmount),
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: { customer: { select: { id: true, name: true, phone: true, email: true } } },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e) { return serverError(e); }
}
