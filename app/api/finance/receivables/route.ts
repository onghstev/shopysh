export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    // Find AR account
    const arAccount = await prisma.glAccount.findFirst({
      where: { tenantId, systemTag: 'AR', isActive: true },
    });

    if (!arAccount) {
      return NextResponse.json({ error: 'AR account not found.' }, { status: 404 });
    }

    const today = new Date();

    // Get all posted lines on AR account
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: arAccount.id,
        journalEntry: { tenantId, status: 'POSTED' },
      },
      include: {
        journalEntry: { select: { entryDate: true } },
      },
    });

    // Group by customerId
    const customerMap = new Map<string, { debit: number; credit: number; buckets: [number, number, number, number] }>();

    for (const line of lines) {
      const key = line.customerId ?? '__unknown__';
      if (!customerMap.has(key)) {
        customerMap.set(key, { debit: 0, credit: 0, buckets: [0, 0, 0, 0] });
      }
      const entry = customerMap.get(key)!;
      const daysOld = Math.floor((today.getTime() - new Date(line.journalEntry.entryDate).getTime()) / 86400000);
      const lineDebit = Number(line.debit);
      const lineCredit = Number(line.credit);
      entry.debit += lineDebit;
      entry.credit += lineCredit;

      // Only debit (charge) lines go in aging buckets
      if (lineDebit > 0) {
        if (daysOld <= 30) entry.buckets[0] += lineDebit;
        else if (daysOld <= 60) entry.buckets[1] += lineDebit;
        else if (daysOld <= 90) entry.buckets[2] += lineDebit;
        else entry.buckets[3] += lineDebit;
      }
    }

    // Fetch customer names
    const customerIds = [...customerMap.keys()].filter(k => k !== '__unknown__');
    const customers = customerIds.length > 0
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const customerLookup = new Map(customers.map(c => [c.id, c]));

    const rows = [...customerMap.entries()].map(([customerId, data]) => {
      const outstanding = data.debit - data.credit;
      const cust = customerId !== '__unknown__' ? customerLookup.get(customerId) : null;
      return {
        customerId,
        customerName: cust?.name ?? (customerId === '__unknown__' ? 'Unknown Customer' : customerId),
        customerEmail: cust?.email ?? null,
        totalDebit: data.debit,
        totalCredit: data.credit,
        outstanding,
        current: data.buckets[0],
        days31_60: data.buckets[1],
        days61_90: data.buckets[2],
        days90plus: data.buckets[3],
      };
    }).filter(r => Math.abs(r.outstanding) > 0.001)
      .sort((a, b) => b.outstanding - a.outstanding);

    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    const totalCurrent = rows.reduce((s, r) => s + r.current, 0);
    const total31_60 = rows.reduce((s, r) => s + r.days31_60, 0);
    const total61_90 = rows.reduce((s, r) => s + r.days61_90, 0);
    const total90plus = rows.reduce((s, r) => s + r.days90plus, 0);

    return NextResponse.json({
      account: { id: arAccount.id, code: arAccount.code, name: arAccount.name },
      rows,
      totals: { totalOutstanding, totalCurrent, total31_60, total61_90, total90plus },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
