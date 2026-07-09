export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { detectDuplicates } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { amount, description, date, vendorId } = await req.json();
    if (!amount || !description || !date) return badRequest('amount, description, date required');

    const thirtyDaysAgo = new Date(date);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        status: 'POSTED',
        entryDate: { gte: thirtyDaysAgo },
        entryType: { in: ['PURCHASE_INVOICE', 'PURCHASE_PAYMENT', 'GENERAL_JOURNAL'] },
      },
      select: { id: true, entryNumber: true, entryDate: true, description: true, totalDebit: true, sourceId: true },
      orderBy: { entryDate: 'desc' },
      take: 200,
    });

    const warnings = detectDuplicates(
      { amount: Number(amount), description, date, vendorId },
      recentEntries.map(e => ({ ...e, totalDebit: Number(e.totalDebit), entryDate: e.entryDate.toISOString() })),
    );

    return NextResponse.json({ warnings });
  } catch (e) { return serverError(e); }
}
