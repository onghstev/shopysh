import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createAndPostJournal, findSystemAccount } from '@/lib/accounting/engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const body = await req.json();
  const { date, customerName, reference, description, amount, vatAmount = 0, paymentMethod } = body;

  if (!date || !description || !amount || !paymentMethod) {
    return NextResponse.json({ error: 'date, description, amount, and paymentMethod are required' }, { status: 400 });
  }

  const total = Number(amount) + Number(vatAmount);

  // Find system accounts
  const [arId, cashId, bankId, salesId, vatOutputId] = await Promise.all([
    findSystemAccount(tenantId, 'AR'),
    findSystemAccount(tenantId, 'CASH'),
    findSystemAccount(tenantId, 'BANK'),
    findSystemAccount(tenantId, 'SALES'),
    findSystemAccount(tenantId, 'VAT_OUTPUT'),
  ]);

  if (!salesId) {
    return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
  }

  // Determine debit account
  let debitAccountId: string | null = null;
  let entryType: string;

  if (paymentMethod === 'INVOICE') {
    if (!arId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    debitAccountId = arId;
    entryType = 'SALES_INVOICE';
  } else if (paymentMethod === 'CASH') {
    if (!cashId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    debitAccountId = cashId;
    entryType = 'SALES_RECEIPT';
  } else if (paymentMethod === 'BANK') {
    if (!bankId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    debitAccountId = bankId;
    entryType = 'SALES_RECEIPT';
  } else {
    return NextResponse.json({ error: 'Invalid paymentMethod. Use INVOICE, CASH, or BANK.' }, { status: 400 });
  }

  // Build journal lines
  const lines: any[] = [
    { accountId: debitAccountId, debit: total, credit: 0, description: `${description}${customerName ? ` — ${customerName}` : ''}` },
    { accountId: salesId, debit: 0, credit: Number(amount), description },
  ];

  if (Number(vatAmount) > 0) {
    if (!vatOutputId) return NextResponse.json({ error: 'VAT_OUTPUT account not found. Please seed accounts first.' }, { status: 422 });
    lines.push({ accountId: vatOutputId, debit: 0, credit: Number(vatAmount), description: 'VAT Output' });
  }

  try {
    const entry = await createAndPostJournal({
      tenantId,
      entryDate: new Date(date),
      description: `${description}${customerName ? ` — ${customerName}` : ''}`,
      entryType,
      reference,
      createdById: userId,
      lines,
    }, userId);

    return NextResponse.json({ entry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 });
  }
}
