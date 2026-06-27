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

    // Find AP account
    const apAccount = await prisma.glAccount.findFirst({
      where: { tenantId, systemTag: 'AP', isActive: true },
    });

    if (!apAccount) {
      return NextResponse.json({ error: 'AP account not found.' }, { status: 404 });
    }

    const today = new Date();

    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: apAccount.id,
        journalEntry: { tenantId, status: 'POSTED' },
      },
      include: {
        journalEntry: { select: { entryDate: true } },
      },
    });

    // Group by vendorId
    const vendorMap = new Map<string, { debit: number; credit: number; buckets: [number, number, number, number] }>();

    for (const line of lines) {
      const key = line.vendorId ?? '__unknown__';
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { debit: 0, credit: 0, buckets: [0, 0, 0, 0] });
      }
      const entry = vendorMap.get(key)!;
      const daysOld = Math.floor((today.getTime() - new Date(line.journalEntry.entryDate).getTime()) / 86400000);
      const lineDebit = Number(line.debit);
      const lineCredit = Number(line.credit);
      entry.debit += lineDebit;
      entry.credit += lineCredit;

      // Credit lines are AP increases (amounts owed to vendor)
      if (lineCredit > 0) {
        if (daysOld <= 30) entry.buckets[0] += lineCredit;
        else if (daysOld <= 60) entry.buckets[1] += lineCredit;
        else if (daysOld <= 90) entry.buckets[2] += lineCredit;
        else entry.buckets[3] += lineCredit;
      }
    }

    // Fetch vendor names
    const vendorIds = [...vendorMap.keys()].filter(k => k !== '__unknown__');
    const vendors = vendorIds.length > 0
      ? await prisma.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const vendorLookup = new Map(vendors.map(v => [v.id, v]));

    const rows = [...vendorMap.entries()].map(([vendorId, data]) => {
      const outstanding = data.credit - data.debit; // AP: credit-normal
      const vendor = vendorId !== '__unknown__' ? vendorLookup.get(vendorId) : null;
      return {
        vendorId,
        vendorName: vendor?.name ?? (vendorId === '__unknown__' ? 'Unknown Vendor' : vendorId),
        vendorEmail: vendor?.email ?? null,
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
      account: { id: apAccount.id, code: apAccount.code, name: apAccount.name },
      rows,
      totals: { totalOutstanding, totalCurrent, total31_60, total61_90, total90plus },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
