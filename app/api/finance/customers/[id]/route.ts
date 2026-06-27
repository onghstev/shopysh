import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const { id } = params;

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalOrders: true,
      lifetimeValue: true,
      createdAt: true,
    },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  // Find AR account and compute balance
  const arAccount = await prisma.glAccount.findFirst({
    where: { tenantId, systemTag: 'AR' },
    select: { id: true },
  });

  let arBalance = 0;
  if (arAccount) {
    const agg = await prisma.journalLine.aggregate({
      where: {
        customerId: id,
        account: { tenantId, systemTag: 'AR' },
        journalEntry: { tenantId, status: 'POSTED' },
      },
      _sum: { debit: true, credit: true },
    });
    const totalDebit = Number(agg._sum.debit ?? 0);
    const totalCredit = Number(agg._sum.credit ?? 0);
    arBalance = totalDebit - totalCredit;
  }

  return NextResponse.json({ customer: { ...customer, arBalance } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const { id } = params;

  const existing = await prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const body = await req.json();
  const { name, phone, email, notes } = body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ customer });
}
