export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const statements = await prisma.bankStatement.findMany({
      where: { tenantId },
      include: {
        lines: { orderBy: { transactionDate: 'asc' } },
      },
      orderBy: { statementDate: 'desc' },
    });

    return NextResponse.json(statements);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { statementDate, openingBalance, closingBalance, currency, lines } = body;

    if (!statementDate) return badRequest('Statement date is required');
    if (!lines || lines.length === 0) return badRequest('Statement must have at least one transaction');

    const statement = await prisma.bankStatement.create({
      data: {
        tenantId,
        statementDate:  new Date(statementDate),
        openingBalance: Number(openingBalance || 0),
        closingBalance: Number(closingBalance || 0),
        currency:       currency || 'NGN',
        status:         'pending',
        lines: {
          create: lines.map((l: any) => ({
            tenantId,
            transactionDate: new Date(l.date),
            description:     l.description,
            debit:           Number(l.debit || 0),
            credit:          Number(l.credit || 0),
            balance:         l.balance != null ? Number(l.balance) : null,
            reference:       l.reference || null,
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json(statement, { status: 201 });
  } catch (e) { return serverError(e); }
}
