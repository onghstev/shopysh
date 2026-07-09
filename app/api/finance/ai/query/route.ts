export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { answerFinanceQuery } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { question } = await req.json();
    if (!question?.trim()) return badRequest('question required');

    const accounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, accountType: true },
      orderBy: { code: 'asc' },
      take: 60,
    });

    const result = await answerFinanceQuery(question, { tenantId, accounts });
    return NextResponse.json(result);
  } catch (e) { return serverError(e); }
}
