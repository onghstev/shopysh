export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { postJournal } from '@/lib/accounting/engine';

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const drafts = await prisma.journalEntry.findMany({
    where: { tenantId, status: 'DRAFT' },
    select: { id: true },
  });

  if (drafts.length === 0) {
    return NextResponse.json({ posted: 0, errors: 0, total: 0, message: 'No DRAFT entries to post' });
  }

  let posted = 0;
  const errorMessages: string[] = [];

  for (const d of drafts) {
    try {
      await postJournal(d.id, tenantId, userId);
      posted++;
    } catch (e: any) {
      errorMessages.push(`${d.id}: ${e.message}`);
    }
  }

  return NextResponse.json({
    posted,
    errors: errorMessages.length,
    total: drafts.length,
    errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
  });
}
