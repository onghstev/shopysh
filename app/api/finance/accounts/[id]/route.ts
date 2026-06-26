export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAccountBalance } from '@/lib/accounting/engine';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const account = await prisma.glAccount.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, accountType: true, isActive: true }, orderBy: { code: 'asc' } },
      },
    });

    if (!account || account.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const balance = await getAccountBalance(params.id);

    const recentLines = await prisma.journalLine.findMany({
      where: { accountId: params.id, journalEntry: { status: 'POSTED' } },
      include: { journalEntry: { select: { entryNumber: true, entryDate: true, description: true, entryType: true } } },
      orderBy: { journalEntry: { entryDate: 'desc' } },
      take: 20,
    });

    return NextResponse.json({ account: { ...account, balance }, transactions: recentLines });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const account = await prisma.glAccount.findUnique({ where: { id: params.id } });
    if (!account || account.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (account.isSystemAccount) {
      return NextResponse.json({ error: 'System accounts cannot be modified' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.glAccount.update({
      where: { id: params.id },
      data: {
        name: body.name ?? account.name,
        accountSubtype: body.accountSubtype ?? account.accountSubtype,
        description: body.description ?? account.description,
        allowPosting: body.allowPosting ?? account.allowPosting,
        isActive: body.isActive ?? account.isActive,
        openingBalance: body.openingBalance != null ? parseFloat(body.openingBalance) : account.openingBalance,
      },
    });

    return NextResponse.json({ account: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const account = await prisma.glAccount.findUnique({ where: { id: params.id }, include: { _count: { select: { journalLines: true, children: true } } } });
    if (!account || account.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (account.isSystemAccount) return NextResponse.json({ error: 'Cannot delete a system account' }, { status: 403 });
    if (account._count.journalLines > 0) return NextResponse.json({ error: 'Account has posted transactions and cannot be deleted' }, { status: 409 });
    if (account._count.children > 0) return NextResponse.json({ error: 'Account has sub-accounts; delete or reassign them first' }, { status: 409 });

    await prisma.glAccount.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Account deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
