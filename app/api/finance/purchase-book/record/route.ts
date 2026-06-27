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
  const { date, vendorId, vendorName, reference, description, amount, vatAmount = 0, expenseAccountId, paymentMethod } = body;
  const effectiveVendorName = vendorName || 'Sundry Vendor';

  if (!date || !description || !amount || !paymentMethod || !expenseAccountId) {
    return NextResponse.json({ error: 'date, description, amount, expenseAccountId, and paymentMethod are required' }, { status: 400 });
  }

  const total = Number(amount) + Number(vatAmount);

  // Find system accounts
  const [apId, cashId, bankId, vatInputId] = await Promise.all([
    findSystemAccount(tenantId, 'AP'),
    findSystemAccount(tenantId, 'CASH'),
    findSystemAccount(tenantId, 'BANK'),
    findSystemAccount(tenantId, 'VAT_INPUT'),
  ]);

  // Determine credit account
  let creditAccountId: string | null = null;
  let entryType: string;

  if (paymentMethod === 'ON_CREDIT') {
    if (!apId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    creditAccountId = apId;
    entryType = 'PURCHASE_INVOICE';
  } else if (paymentMethod === 'CASH') {
    if (!cashId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    creditAccountId = cashId;
    entryType = 'PURCHASE_PAYMENT';
  } else if (paymentMethod === 'BANK') {
    if (!bankId) return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
    creditAccountId = bankId;
    entryType = 'PURCHASE_PAYMENT';
  } else {
    return NextResponse.json({ error: 'Invalid paymentMethod. Use ON_CREDIT, CASH, or BANK.' }, { status: 400 });
  }

  const desc = `${description} — ${effectiveVendorName}`;

  // Build journal lines
  const lines: any[] = [
    { accountId: expenseAccountId, debit: Number(amount), credit: 0, description: desc },
  ];

  if (Number(vatAmount) > 0) {
    if (!vatInputId) return NextResponse.json({ error: 'VAT_INPUT account not found. Please seed accounts first.' }, { status: 422 });
    lines.push({ accountId: vatInputId, debit: Number(vatAmount), credit: 0, description: 'VAT Input' });
  }

  lines.push({ accountId: creditAccountId, debit: 0, credit: total, description: desc, vendorId: vendorId || undefined });

  try {
    const entry = await createAndPostJournal({
      tenantId,
      entryDate: new Date(date),
      description: desc,
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
