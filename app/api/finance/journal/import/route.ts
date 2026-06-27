import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ImportRow {
  date: string;
  description: string;
  accountCode: string;
  debit: number;
  credit: number;
  reference?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;

  const body = await req.json();
  const rows: ImportRow[] = body.rows ?? [];

  if (!rows.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 });

  // Load all GL accounts for this tenant keyed by code
  const glAccounts = await prisma.glAccount.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, code: true, allowPosting: true },
  });
  const accountByCode = new Map(glAccounts.map(a => [a.code, a]));

  // Validate rows
  const errors: string[] = [];
  rows.forEach((r, i) => {
    const rowNum = i + 2; // 1-indexed + header
    if (!r.date) errors.push(`Row ${rowNum}: date is required`);
    if (!r.description) errors.push(`Row ${rowNum}: description is required`);
    if (!r.accountCode) errors.push(`Row ${rowNum}: account_code is required`);
    else {
      const acc = accountByCode.get(String(r.accountCode).trim());
      if (!acc) errors.push(`Row ${rowNum}: account code "${r.accountCode}" not found`);
      else if (!acc.allowPosting) errors.push(`Row ${rowNum}: account "${r.accountCode}" does not allow posting`);
    }
    if (isNaN(Number(r.debit)) || isNaN(Number(r.credit))) {
      errors.push(`Row ${rowNum}: debit and credit must be numbers`);
    }
  });

  if (errors.length) return NextResponse.json({ created: 0, errors }, { status: 422 });

  // Group rows into journal entries (consecutive rows with same date+description = one entry)
  interface Group {
    date: string;
    description: string;
    reference?: string;
    lines: { accountId: string; debit: number; credit: number; description: string }[];
  }

  const groups: Group[] = [];
  let current: Group | null = null;

  for (const r of rows) {
    const key = `${r.date}||${r.description}`;
    if (!current || `${current.date}||${current.description}` !== key) {
      current = { date: r.date, description: r.description, reference: r.reference, lines: [] };
      groups.push(current);
    }
    const acc = accountByCode.get(String(r.accountCode).trim())!;
    current.lines.push({
      accountId: acc.id,
      debit: Number(r.debit) || 0,
      credit: Number(r.credit) || 0,
      description: r.description,
    });
  }

  // Validate balance per group
  const balanceErrors: string[] = [];
  groups.forEach((g, i) => {
    const totalDebit = g.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = g.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.005) {
      balanceErrors.push(`Entry "${g.description}" (${g.date}): debits ${totalDebit.toFixed(2)} ≠ credits ${totalCredit.toFixed(2)}`);
    }
  });

  if (balanceErrors.length) return NextResponse.json({ created: 0, errors: balanceErrors }, { status: 422 });

  // Create journal entries as DRAFT
  let created = 0;
  const createErrors: string[] = [];

  for (const g of groups) {
    try {
      const count = await prisma.journalEntry.count({ where: { tenantId } });
      const year = new Date().getFullYear();
      const entryNumber = `JE-${year}-${String(count + 1).padStart(5, '0')}`;
      const entryDate = new Date(g.date);
      const totalDebit = g.lines.reduce((s, l) => s + l.debit, 0);

      await prisma.journalEntry.create({
        data: {
          tenantId,
          entryNumber,
          entryDate,
          description: g.description,
          entryType: 'GENERAL_JOURNAL',
          status: 'DRAFT',
          reference: g.reference,
          currency: 'NGN',
          totalDebit,
          totalCredit: totalDebit,
          lines: {
            create: g.lines.map((l, i) => ({
              accountId: l.accountId,
              lineNumber: i + 1,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
              baseDebit: l.debit,
              baseCredit: l.credit,
            })),
          },
        },
      });
      created++;
    } catch (e: any) {
      createErrors.push(`Failed to create entry "${g.description}": ${e.message}`);
    }
  }

  return NextResponse.json({ created, errors: createErrors });
}
