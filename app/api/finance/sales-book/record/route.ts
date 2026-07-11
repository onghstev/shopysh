import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createJournalEntry, createAndPostJournal } from '@/lib/accounting/engine';
import { getFinanceSettings, resolveGLAccount } from '@/lib/accounting/gl-mappings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = session.user.tenantId;
  const userId   = session.user.id;

  const body = await req.json();
  const {
    date, customerId, customerName, reference, paymentMethod,
    vatAmount = 0,
    items,
    description: legacyDesc,
    amount:      legacyAmount,
  } = body;

  const effectiveCustomerName = customerName || 'Sundry Customer';

  const saleItems: { description: string; qty: number; unitPrice: number; lineTotal: number }[] =
    Array.isArray(items) && items.length > 0
      ? items.map((it: any) => {
          const qty       = Number(it.qty)       || 1;
          const unitPrice = Number(it.unitPrice)  || 0;
          const lineTotal = Number(it.lineTotal)  || qty * unitPrice;
          return { description: String(it.description || ''), qty, unitPrice, lineTotal };
        })
      : [{ description: String(legacyDesc || ''), qty: 1, unitPrice: Number(legacyAmount) || 0, lineTotal: Number(legacyAmount) || 0 }];

  if (!date || !paymentMethod || saleItems.length === 0) {
    return NextResponse.json({ error: 'date, paymentMethod, and at least one item are required' }, { status: 400 });
  }
  if (saleItems.some(it => !it.description || it.lineTotal <= 0)) {
    return NextResponse.json({ error: 'Each item must have a description and a positive amount' }, { status: 400 });
  }

  const netTotal = saleItems.reduce((s, it) => s + it.lineTotal, 0);
  const vat      = Number(vatAmount);
  const total    = netTotal + vat;

  const headerDesc = saleItems.length === 1
    ? saleItems[0].description
    : `${saleItems.length} items — ${reference || 'sale'}`;

  const { glPostingMode, glAccountMappings } = await getFinanceSettings(tenantId);

  const [arId, cashId, bankId, salesId, vatOutputId] = await Promise.all([
    resolveGLAccount(tenantId, 'AR', glAccountMappings),
    resolveGLAccount(tenantId, 'CASH', glAccountMappings),
    resolveGLAccount(tenantId, 'BANK', glAccountMappings),
    resolveGLAccount(tenantId, 'SALES', glAccountMappings),
    resolveGLAccount(tenantId, 'VAT_OUTPUT', glAccountMappings),
  ]);

  if (!salesId) {
    return NextResponse.json({ error: 'Chart of accounts not set up. Please seed accounts first.' }, { status: 422 });
  }

  let debitAccountId: string | null = null;
  let entryType: string;

  if (paymentMethod === 'INVOICE') {
    if (!arId) return NextResponse.json({ error: 'AR account not set up.' }, { status: 422 });
    debitAccountId = arId;
    entryType = 'SALES_INVOICE';
  } else if (paymentMethod === 'CASH') {
    if (!cashId) return NextResponse.json({ error: 'Cash account not set up.' }, { status: 422 });
    debitAccountId = cashId;
    entryType = 'SALES_RECEIPT';
  } else if (paymentMethod === 'BANK') {
    if (!bankId) return NextResponse.json({ error: 'Bank account not set up.' }, { status: 422 });
    debitAccountId = bankId;
    entryType = 'SALES_RECEIPT';
  } else {
    return NextResponse.json({ error: 'Invalid paymentMethod. Use INVOICE, CASH, or BANK.' }, { status: 400 });
  }

  const lines: any[] = [
    {
      accountId:   debitAccountId,
      debit:       total,
      credit:      0,
      description: `${headerDesc} — ${effectiveCustomerName}`,
      customerId:  customerId || undefined,
    },
  ];

  for (const it of saleItems) {
    lines.push({ accountId: salesId, debit: 0, credit: it.lineTotal, description: it.description });
  }

  if (vat > 0) {
    if (!vatOutputId) return NextResponse.json({ error: 'VAT_OUTPUT account not found.' }, { status: 422 });
    lines.push({ accountId: vatOutputId, debit: 0, credit: vat, description: 'VAT Output' });
  }

  const journalInput = {
    tenantId,
    entryDate:   new Date(date),
    description: `${headerDesc} — ${effectiveCustomerName}`,
    entryType,
    reference,
    createdById: userId,
    lines,
  };

  try {
    const entry = glPostingMode === 'EOD'
      ? await createJournalEntry(journalInput)
      : await createAndPostJournal(journalInput, userId);
    return NextResponse.json({ entry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 });
  }
}
