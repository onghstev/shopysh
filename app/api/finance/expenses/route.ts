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
    const categoryId = searchParams.get('categoryId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
    ]);

    const totalAmount = await prisma.expense.aggregate({ where, _sum: { amount: true } });

    return NextResponse.json({ items, total, totalAmount: totalAmount._sum.amount || 0, page, pageSize });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { categoryId, description, amount, paymentMethod, vendor, reference, date, notes, isRecurring } = body;

    if (!description || !amount || !date) return badRequest('Description, amount and date are required');

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        categoryId: categoryId || null,
        description,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || null,
        vendor: vendor || null,
        reference: reference || null,
        date: new Date(date),
        notes: notes || null,
        isRecurring: isRecurring || false,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e) { return serverError(e); }
}
