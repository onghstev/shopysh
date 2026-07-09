export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { suggestAccount } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { description, transactionType } = await req.json();
    if (!description) return badRequest('description required');

    const accounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, accountType: true },
      orderBy: { code: 'asc' },
    });

    const suggestion = await suggestAccount(description, accounts, transactionType ?? 'any');
    return NextResponse.json({ suggestion });
  } catch (e) { return serverError(e); }
}
