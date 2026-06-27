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
  const { type, date, description, amount, contraAccountId, customerId, vendorId } = body;

  if (!type || !date || !description || !amount || !contraAccountId) {
    return NextResponse.json({ error: 'type, date, description, amount, and contraAccountId are required' }, { status: 400 });
  }
  if (type !== 'RECEIPT' && type !== 'PAYMENT') {
    return NextResponse.json({ error: 'type must be RECEIPT or PAYMENT' }, { status: 400 });
  }

  const cashId = await findSystemAccount(tenantId, 'CASH');
  if (!cashId) {
    return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
  }

  const amt = Number(amount);
  const lines =
    type === 'RECEIPT'
      ? [
          { accountId: cashId, debit: amt, credit: 0, description, customerId: customerId || undefined },
          { accountId: contraAccountId, debit: 0, credit: amt, description },
        ]
      : [
          { accountId: contraAccountId, debit: amt, credit: 0, description },
          { accountId: cashId, debit: 0, credit: amt, description, vendorId: vendorId || undefined },
        ];

  try {
    const entry = await createAndPostJournal({
      tenantId,
      entryDate: new Date(date),
      description,
      entryType: type === 'RECEIPT' ? 'CASH_RECEIPT' : 'CASH_PAYMENT',
      createdById: userId,
      lines,
    }, userId);

    return NextResponse.json({ entry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 });
  }
}
