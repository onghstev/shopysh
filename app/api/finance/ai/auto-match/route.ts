export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { scoreMatchCandidates } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { statementId } = await req.json();
    if (!statementId) return badRequest('statementId required');

    // Load unmatched bank lines
    const statement = await prisma.bankStatement.findFirst({
      where: { id: statementId, tenantId },
      include: { lines: { where: { isMatched: false, isIgnored: false } } },
    });
    if (!statement) return NextResponse.json({ error: 'Statement not found' }, { status: 404 });

    // Load recent posted GL entries (within 60 days of statement date)
    const from = new Date(statement.statementDate);
    from.setDate(from.getDate() - 60);
    const to = new Date(statement.statementDate);
    to.setDate(to.getDate() + 7);

    const glEntries = await prisma.journalEntry.findMany({
      where: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } },
      select: { id: true, entryNumber: true, entryDate: true, description: true, totalDebit: true, totalCredit: true },
      orderBy: { entryDate: 'desc' },
      take: 300,
    });

    const glMapped = glEntries.map(e => ({
      ...e,
      entryDate:   e.entryDate.toISOString().slice(0, 10),
      totalDebit:  Number(e.totalDebit),
      totalCredit: Number(e.totalCredit),
    }));

    // Score candidates for each unmatched line
    const suggestions = statement.lines.map(line => ({
      lineId:     line.id,
      candidates: scoreMatchCandidates(
        {
          date:        new Date(line.transactionDate).toISOString().slice(0, 10),
          description: line.description,
          amount:      Number(line.credit) > 0 ? Number(line.credit) : Number(line.debit),
        },
        glMapped,
      ),
    }));

    // Auto-apply matches with score >= 80
    const autoMatched: string[] = [];
    for (const s of suggestions) {
      const top = s.candidates[0];
      if (top && top.score >= 80) {
        await prisma.bankStatementLine.update({
          where: { id: s.lineId },
          data: { isMatched: true, matchedEntryId: top.entryId },
        });
        autoMatched.push(s.lineId);
      }
    }

    return NextResponse.json({ suggestions, autoMatched });
  } catch (e) { return serverError(e); }
}
