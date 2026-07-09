export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { chatCompletionText } from '@/lib/llm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

// ── Step 1: classify the question into a query intent ────────────────────────
type Intent =
  | 'top_expenses'
  | 'total_expenses'
  | 'total_revenue'
  | 'cash_balance'
  | 'net_profit'
  | 'account_balance'
  | 'recent_transactions'
  | 'overdue_invoices'
  | 'top_vendors'
  | 'expense_by_category'
  | 'unknown';

async function classifyIntent(question: string): Promise<{ intent: Intent; period?: string; accountKeyword?: string }> {
  const prompt = `Classify this finance question into exactly one intent tag.

Question: "${question}"

Intent options:
- top_expenses        (what are my biggest/top expenses, what did I spend most on)
- total_expenses      (total spending, how much did I spend)
- total_revenue       (total income, revenue, sales)
- cash_balance        (current cash, bank balance, how much cash do I have)
- net_profit          (profit, net income, bottom line, P&L)
- account_balance     (balance on a specific account by name or code)
- recent_transactions (last N transactions, recent entries, latest postings)
- overdue_invoices    (unpaid invoices, overdue receivables, who owes me)
- top_vendors         (top suppliers, who do I pay most)
- expense_by_category (expenses by category, breakdown of spending)
- unknown             (anything else)

Also extract:
- period: "this_month" | "last_month" | "this_year" | "last_quarter" | null
- accountKeyword: specific account name or code mentioned, or null

Respond ONLY with valid JSON: {"intent":"...","period":"...","accountKeyword":"..."}`;

  try {
    const raw = await chatCompletionText({ messages: [{ role: 'user', content: prompt }], maxTokens: 80, temperature: 0 });
    const m = raw.match(/\{[\s\S]*?\}/);
    if (m) return JSON.parse(m[0]);
  } catch { /* fall through */ }
  return { intent: 'unknown' };
}

// ── Step 2: fetch real data from the DB ─────────────────────────────────────
function dateRange(period?: string): { from: Date; to: Date; label: string } {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = now.getMonth();

  if (period === 'last_month') {
    const from = new Date(y, m - 1, 1);
    const to   = new Date(y, m, 0, 23, 59, 59);
    return { from, to, label: from.toLocaleString('en-NG', { month: 'long', year: 'numeric' }) };
  }
  if (period === 'last_quarter') {
    const qStart = new Date(y, Math.floor(m / 3) * 3 - 3, 1);
    const qEnd   = new Date(y, Math.floor(m / 3) * 3, 0, 23, 59, 59);
    return { from: qStart, to: qEnd, label: 'last quarter' };
  }
  if (period === 'this_year') {
    return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59), label: `${y}` };
  }
  // default: this month
  return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59), label: new Date(y, m).toLocaleString('en-NG', { month: 'long', year: 'numeric' }) };
}

async function fetchData(intent: Intent, tenantId: string, period?: string, accountKeyword?: string): Promise<string> {
  const { from, to, label } = dateRange(period);
  const entryWhere = { tenantId, status: 'POSTED' as const, entryDate: { gte: from, lte: to } };

  switch (intent) {

    case 'top_expenses': {
      const expAccounts = await prisma.glAccount.findMany({ where: { tenantId, accountType: 'EXPENSE', isActive: true }, select: { id: true, name: true } });
      const rows = await Promise.all(expAccounts.map(async a => {
        const agg = await prisma.journalLine.aggregate({ where: { accountId: a.id, journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } }, _sum: { debit: true } });
        return { name: a.name, total: Number(agg._sum.debit ?? 0) };
      }));
      const top = rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
      if (!top.length) return `No expense postings found for ${label}.`;
      return `Top expenses for ${label}:\n` + top.map((r, i) => `${i + 1}. ${r.name}: ${fmt(r.total)}`).join('\n');
    }

    case 'total_expenses': {
      const agg = await prisma.journalEntry.aggregate({ where: { ...entryWhere, entryType: { in: ['PURCHASE_INVOICE', 'PURCHASE_PAYMENT', 'GENERAL_JOURNAL'] } }, _sum: { totalDebit: true } });
      const total = Number(agg._sum.totalDebit ?? 0);
      return `Total expenses posted for ${label}: ${fmt(total)}.`;
    }

    case 'total_revenue': {
      const salesAccounts = await prisma.glAccount.findMany({ where: { tenantId, accountType: 'INCOME', isActive: true }, select: { id: true } });
      const ids = salesAccounts.map(a => a.id);
      if (!ids.length) return `No income accounts found in chart of accounts.`;
      const agg = await prisma.journalLine.aggregate({ where: { accountId: { in: ids }, journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } }, _sum: { credit: true } });
      const total = Number(agg._sum.credit ?? 0);
      return `Total revenue for ${label}: ${fmt(total)}.`;
    }

    case 'cash_balance': {
      const cashAccounts = await prisma.glAccount.findMany({ where: { tenantId, systemTag: { in: ['CASH', 'BANK'] }, isActive: true }, select: { id: true, name: true } });
      if (!cashAccounts.length) return `No cash or bank accounts tagged in your chart of accounts.`;
      const balances = await Promise.all(cashAccounts.map(async a => {
        const agg = await prisma.journalLine.aggregate({ where: { accountId: a.id, journalEntry: { tenantId, status: 'POSTED' } }, _sum: { debit: true, credit: true } });
        return { name: a.name, balance: Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0) };
      }));
      const total = balances.reduce((s, b) => s + b.balance, 0);
      const lines = balances.map(b => `  ${b.name}: ${fmt(b.balance)}`).join('\n');
      return `Current cash and bank balances:\n${lines}\nTotal: ${fmt(total)}`;
    }

    case 'net_profit': {
      const incomeAccts = await prisma.glAccount.findMany({ where: { tenantId, accountType: 'INCOME', isActive: true }, select: { id: true } });
      const expenseAccts = await prisma.glAccount.findMany({ where: { tenantId, accountType: 'EXPENSE', isActive: true }, select: { id: true } });
      const incomeIds  = incomeAccts.map(a => a.id);
      const expenseIds = expenseAccts.map(a => a.id);
      const [incAgg, expAgg] = await Promise.all([
        incomeIds.length  ? prisma.journalLine.aggregate({ where: { accountId: { in: incomeIds },  journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } }, _sum: { credit: true } }) : { _sum: { credit: 0 } },
        expenseIds.length ? prisma.journalLine.aggregate({ where: { accountId: { in: expenseIds }, journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } }, _sum: { debit: true  } }) : { _sum: { debit:  0 } },
      ]);
      const revenue  = Number(incAgg._sum.credit ?? 0);
      const expenses = Number(expAgg._sum.debit  ?? 0);
      const profit   = revenue - expenses;
      return `Income statement for ${label}:\n  Revenue: ${fmt(revenue)}\n  Expenses: ${fmt(expenses)}\n  Net ${profit >= 0 ? 'Profit' : 'Loss'}: ${fmt(Math.abs(profit))}${profit < 0 ? ' (loss)' : ''}`;
    }

    case 'account_balance': {
      if (!accountKeyword) return `Please specify which account you want the balance for.`;
      const kw = accountKeyword.toLowerCase();
      const account = await prisma.glAccount.findFirst({
        where: { tenantId, isActive: true, OR: [{ name: { contains: kw, mode: 'insensitive' } }, { code: { contains: kw, mode: 'insensitive' } }] },
        select: { id: true, name: true, code: true, accountType: true },
      });
      if (!account) return `Could not find an account matching "${accountKeyword}".`;
      const agg = await prisma.journalLine.aggregate({ where: { accountId: account.id, journalEntry: { tenantId, status: 'POSTED' } }, _sum: { debit: true, credit: true } });
      const net = Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0);
      return `Account: ${account.code} — ${account.name}\nAll-time balance: ${fmt(net)} (${net >= 0 ? 'debit' : 'credit'} balance)`;
    }

    case 'recent_transactions': {
      const entries = await prisma.journalEntry.findMany({
        where: { tenantId, status: 'POSTED' },
        orderBy: { entryDate: 'desc' },
        take: 10,
        select: { entryNumber: true, entryDate: true, description: true, totalDebit: true },
      });
      if (!entries.length) return `No posted journal entries found.`;
      return `Last ${entries.length} posted transactions:\n` + entries.map(e =>
        `  ${new Date(e.entryDate).toLocaleDateString('en-NG')} — ${e.entryNumber} — ${e.description} — ${fmt(Number(e.totalDebit))}`
      ).join('\n');
    }

    case 'overdue_invoices': {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const invoices = await prisma.invoice.findMany({
        where: { tenantId, status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }, dueDate: { lt: thirtyDaysAgo } },
        select: { invoiceNumber: true, totalAmount: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });
      if (!invoices.length) return `No overdue invoices found (>30 days past due).`;
      const total = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
      return `${invoices.length} overdue invoices (>30 days), total ${fmt(total)}:\n` +
        invoices.map(i => `  ${i.invoiceNumber} — ${fmt(Number(i.totalAmount))} — due ${new Date(i.dueDate!).toLocaleDateString('en-NG')}`).join('\n');
    }

    case 'top_vendors': {
      const payments = await prisma.journalEntry.findMany({
        where: { ...entryWhere, entryType: { in: ['PURCHASE_PAYMENT', 'PURCHASE_INVOICE'] } },
        select: { description: true, totalDebit: true },
        orderBy: { totalDebit: 'desc' },
        take: 50,
      });
      // Aggregate by description keyword
      const map: Record<string, number> = {};
      for (const p of payments) {
        const key = p.description.split('—')[1]?.trim() || p.description.slice(0, 30);
        map[key] = (map[key] ?? 0) + Number(p.totalDebit);
      }
      const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (!top.length) return `No purchase postings found for ${label}.`;
      return `Top vendors/payees for ${label}:\n` + top.map(([k, v], i) => `${i + 1}. ${k}: ${fmt(v)}`).join('\n');
    }

    case 'expense_by_category': {
      const expAccounts = await prisma.glAccount.findMany({ where: { tenantId, accountType: 'EXPENSE', isActive: true }, select: { id: true, name: true } });
      const rows = await Promise.all(expAccounts.map(async a => {
        const agg = await prisma.journalLine.aggregate({ where: { accountId: a.id, journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } }, _sum: { debit: true } });
        return { name: a.name, total: Number(agg._sum.debit ?? 0) };
      }));
      const all = rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total);
      const grandTotal = all.reduce((s, r) => s + r.total, 0);
      if (!all.length) return `No expense postings found for ${label}.`;
      return `Expense breakdown for ${label} (total ${fmt(grandTotal)}):\n` +
        all.map(r => `  ${r.name}: ${fmt(r.total)} (${grandTotal > 0 ? ((r.total / grandTotal) * 100).toFixed(1) : 0}%)`).join('\n');
    }

    default:
      return '';
  }
}

// ── Step 3: format the data into a natural answer ────────────────────────────
async function formatAnswer(question: string, rawData: string): Promise<string> {
  const prompt = `You are a finance assistant for an African SME using Shopysh accounting software.

The user asked: "${question}"

Here is the exact data retrieved from their books:
${rawData}

Write a clear, direct answer in 2–4 sentences using these exact figures. Use ₦ currency symbol. Do NOT add caveats about "checking the system" — the data is already retrieved. Be conversational and helpful.`;

  try {
    return await chatCompletionText({ messages: [{ role: 'user', content: prompt }], maxTokens: 250, temperature: 0.3 });
  } catch {
    return rawData; // fall back to raw data if LLM formatting fails
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { question } = await req.json();
    if (!question?.trim()) return badRequest('question required');

    // Step 1: classify
    const { intent, period, accountKeyword } = await classifyIntent(question);

    // Step 2: fetch real data
    const rawData = intent !== 'unknown'
      ? await fetchData(intent, tenantId, period ?? undefined, accountKeyword ?? undefined)
      : null;

    if (!rawData) {
      // Fallback for unknown intents
      const fallback = await chatCompletionText({
        messages: [{ role: 'user', content: `You are a finance assistant. The user asked: "${question}". Suggest which finance report or page in their accounting software they should visit to find this information. Keep it under 2 sentences.` }],
        maxTokens: 120, temperature: 0.3,
      }).catch(() => 'I could not process that query. Try asking about expenses, revenue, cash balance, or net profit for a specific period.');
      return NextResponse.json({ answer: fallback, intent });
    }

    // Step 3: format
    const answer = await formatAnswer(question, rawData);
    return NextResponse.json({ answer, rawData, intent });

  } catch (e) { return serverError(e); }
}
