export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'INV'; // INV | RCT | BILL

  const year = new Date().getFullYear();
  const prefix = type.toUpperCase();

  // Count how many entries of this type exist for this tenant/year
  const existing = await prisma.journalEntry.findFirst({
    where: {
      tenantId,
      reference: { startsWith: `${prefix}-${year}-` },
    },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  let nextSeq = 1;
  if (existing?.reference) {
    const parts = existing.reference.split('-');
    const seq = parseInt(parts[parts.length - 1] ?? '0', 10);
    if (!isNaN(seq)) nextSeq = seq + 1;
  }

  const reference = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  return NextResponse.json({ reference });
}
