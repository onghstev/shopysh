export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { tenantId };
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      prisma.income.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.income.count({ where }),
    ]);

    const totalAmount = await prisma.income.aggregate({ where, _sum: { amount: true } });

    return NextResponse.json({ items, total, totalAmount: totalAmount._sum.amount || 0, page, pageSize });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { category, description, amount, paymentMethod, reference, customerId, invoiceId, date, notes } = body;

    if (!category || !description || !amount || !date) return badRequest('Category, description, amount and date are required');

    const income = await prisma.income.create({
      data: {
        tenantId,
        category,
        description,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        customerId: customerId || null,
        invoiceId: invoiceId || null,
        date: new Date(date),
        notes: notes || null,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (e) { return serverError(e); }
}
