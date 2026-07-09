/**
 * AI-powered finance intelligence for the Finance Module.
 * All functions fail open — if the LLM is unavailable, sensible fallbacks
 * are returned so the UI never crashes.
 */

import { chatCompletionText } from './llm';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMART TRANSACTION CATEGORISATION
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountSuggestion {
  accountId: string;
  accountCode: string;
  accountName: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Given a transaction description, suggest the most appropriate GL account
 * from the tenant's chart of accounts.
 */
export async function suggestAccount(
  description: string,
  accounts: Array<{ id: string; code: string; name: string; accountType: string }>,
  transactionType: 'expense' | 'income' | 'any' = 'any',
): Promise<AccountSuggestion | null> {
  if (!description?.trim() || accounts.length === 0) return null;

  const filtered = transactionType === 'any'
    ? accounts
    : accounts.filter(a =>
        transactionType === 'expense'
          ? a.accountType === 'EXPENSE'
          : ['INCOME', 'REVENUE'].includes(a.accountType),
      );

  if (filtered.length === 0) return null;

  const accountList = filtered
    .map(a => `${a.code}: ${a.name} (${a.accountType})`)
    .join('\n');

  const prompt = `You are an accounting assistant for an African SME. Given the transaction description below, pick the single best GL account from the list provided.

Respond ONLY with valid JSON in this exact shape:
{"code":"<account code>","confidence":"high"|"medium"|"low","reason":"<one short sentence>"}

Transaction description: "${description}"

Available accounts:
${accountList}`;

  try {
    const raw = await chatCompletionText({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 150,
      temperature: 0.1,
    });

    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    const acc = filtered.find(a => a.code === String(parsed.code));
    if (!acc) return null;

    return {
      accountId:   acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      confidence:  ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
      reason:      String(parsed.reason ?? ''),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DUPLICATE INVOICE DETECTION (rule-based, no LLM needed)
// ─────────────────────────────────────────────────────────────────────────────

export interface DuplicateWarning {
  existingEntryId: string;
  existingEntryNumber: string;
  existingDate: string;
  existingDescription: string;
  amount: number;
  daysDiff: number;
  similarity: 'exact' | 'probable';
}

export function detectDuplicates(
  newEntry: { amount: number; description: string; date: string; vendorId?: string },
  recentEntries: Array<{
    id: string;
    entryNumber: string;
    entryDate: string;
    description: string;
    totalDebit: number;
    sourceId?: string | null;
  }>,
  windowDays = 30,
): DuplicateWarning[] {
  const newDate = new Date(newEntry.date);
  const warnings: DuplicateWarning[] = [];

  for (const e of recentEntries) {
    const entryDate = new Date(e.entryDate);
    const daysDiff = Math.abs((newDate.getTime() - entryDate.getTime()) / 86_400_000);
    if (daysDiff > windowDays) continue;

    const amountMatch = Math.abs(Number(e.totalDebit) - newEntry.amount) < 0.01;
    if (!amountMatch) continue;

    const descA = newEntry.description.toLowerCase().replace(/[^a-z0-9]/g, '');
    const descB = e.description.toLowerCase().replace(/[^a-z0-9]/g, '');
    const exact = descA === descB;
    const probable = !exact && (descA.includes(descB.slice(0, 8)) || descB.includes(descA.slice(0, 8)));

    if (exact || probable) {
      warnings.push({
        existingEntryId:     e.id,
        existingEntryNumber: e.entryNumber,
        existingDate:        e.entryDate,
        existingDescription: e.description,
        amount:              newEntry.amount,
        daysDiff:            Math.round(daysDiff),
        similarity:          exact ? 'exact' : 'probable',
      });
    }
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ANOMALY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export interface Anomaly {
  type: 'large_amount' | 'wrong_direction' | 'round_number' | 'weekend_posting' | 'unusual_account';
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Rule-based anomaly checks for a journal entry before it is posted.
 * Returns an array of anomalies (empty = clean).
 */
export function detectAnomalies(entry: {
  lines: Array<{ accountType: string; accountCode: string; accountName: string; debit: number; credit: number }>;
  entryDate: string;
  totalAmount: number;
  monthlyAverage?: number; // average transaction size for this tenant
}): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const date = new Date(entry.entryDate);

  // Weekend posting
  const dow = date.getDay();
  if (dow === 0 || dow === 6) {
    anomalies.push({ type: 'weekend_posting', severity: 'warning', message: `Transaction dated on a ${dow === 0 ? 'Sunday' : 'Saturday'} — confirm this is intentional` });
  }

  // Large amount (> 3× monthly average)
  if (entry.monthlyAverage && entry.totalAmount > entry.monthlyAverage * 3) {
    anomalies.push({ type: 'large_amount', severity: 'warning', message: `Amount ₦${entry.totalAmount.toLocaleString()} is ${Math.round(entry.totalAmount / entry.monthlyAverage)}× your monthly average — verify before posting` });
  }

  // Round number > ₦100k (possible estimation)
  if (entry.totalAmount >= 100_000 && entry.totalAmount % 10_000 === 0) {
    anomalies.push({ type: 'round_number', severity: 'warning', message: `Round number ₦${entry.totalAmount.toLocaleString()} — ensure this is an exact amount, not an estimate` });
  }

  // Debit to INCOME or Credit to EXPENSE (wrong direction)
  for (const line of entry.lines) {
    if (line.accountType === 'INCOME' && line.debit > 0) {
      anomalies.push({ type: 'wrong_direction', severity: 'error', message: `Debit to income account "${line.accountName}" — income accounts are normally credited` });
    }
    if (line.accountType === 'EXPENSE' && line.credit > 0) {
      anomalies.push({ type: 'wrong_direction', severity: 'error', message: `Credit to expense account "${line.accountName}" — expense accounts are normally debited` });
    }
  }

  return anomalies;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BANK STATEMENT AUTO-MATCHING
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchCandidate {
  entryId: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  amount: number;
  score: number; // 0–100
  reasons: string[];
}

/**
 * Score each GL entry against a bank statement line.
 * Returns candidates sorted by score descending.
 */
export function scoreMatchCandidates(
  bankLine: { date: string; description: string; amount: number },
  glEntries: Array<{ id: string; entryNumber: string; entryDate: string; description: string; totalDebit: number; totalCredit: number }>,
): MatchCandidate[] {
  const bankDate = new Date(bankLine.date);
  const bankDesc = bankLine.description.toLowerCase();
  const candidates: MatchCandidate[] = [];

  for (const entry of glEntries) {
    const glDate  = new Date(entry.entryDate);
    const glAmt   = Math.max(Number(entry.totalDebit), Number(entry.totalCredit));
    const daysDiff = Math.abs((bankDate.getTime() - glDate.getTime()) / 86_400_000);
    const amtDiff  = Math.abs(glAmt - bankLine.amount);

    let score = 0;
    const reasons: string[] = [];

    // Amount match (most important)
    if (amtDiff < 0.01)          { score += 50; reasons.push('Exact amount match'); }
    else if (amtDiff < 1)        { score += 30; reasons.push('Near-exact amount'); }
    else if (amtDiff / bankLine.amount < 0.02) { score += 15; reasons.push('Amount within 2%'); }
    else continue; // amount too far off — skip entirely

    // Date proximity
    if (daysDiff === 0)          { score += 30; reasons.push('Same date'); }
    else if (daysDiff <= 1)      { score += 20; reasons.push('1 day apart'); }
    else if (daysDiff <= 3)      { score += 10; reasons.push(`${Math.round(daysDiff)} days apart`); }
    else if (daysDiff <= 7)      { score +=  5; reasons.push(`${Math.round(daysDiff)} days apart`); }
    else if (daysDiff > 14)      continue; // too far apart

    // Description similarity (keyword overlap)
    const glDesc   = entry.description.toLowerCase();
    const bankWords = bankDesc.split(/\s+/).filter(w => w.length > 3);
    const glWords   = glDesc.split(/\s+/).filter(w => w.length > 3);
    const overlap   = bankWords.filter(w => glWords.some(g => g.includes(w) || w.includes(g))).length;
    if (overlap > 0) {
      const pct = overlap / Math.max(bankWords.length, 1);
      score += Math.round(pct * 20);
      reasons.push(`${overlap} keyword match${overlap > 1 ? 'es' : ''}`);
    }

    candidates.push({ entryId: entry.id, entryNumber: entry.entryNumber, entryDate: entry.entryDate, description: entry.description, amount: glAmt, score: Math.min(score, 100), reasons });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VAT FILING NARRATIVE
// ─────────────────────────────────────────────────────────────────────────────

export async function generateVATNarrative(data: {
  from: string;
  to: string;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
  outputTransactions: number;
  inputTransactions: number;
}): Promise<string> {
  const prompt = `Write a concise, professional VAT return narrative for a Nigerian business to submit alongside their FIRS VAT return. Write 2–3 sentences only. Use the figures below.

Period: ${data.from} to ${data.to}
Output VAT collected (from sales): ₦${data.outputVAT.toLocaleString('en-NG', { minimumFractionDigits: 2 })} across ${data.outputTransactions} transactions
Input VAT paid (on purchases): ₦${data.inputVAT.toLocaleString('en-NG', { minimumFractionDigits: 2 })} across ${data.inputTransactions} transactions
Net VAT ${data.vatPayable >= 0 ? 'payable to FIRS' : 'credit (refundable)'}: ₦${Math.abs(data.vatPayable).toLocaleString('en-NG', { minimumFractionDigits: 2 })}

Write ONLY the narrative text. No headings, no JSON.`;

  try {
    const text = await chatCompletionText({ messages: [{ role: 'user', content: prompt }], maxTokens: 200, temperature: 0.3 });
    return text.trim();
  } catch {
    return `For the period ${data.from} to ${data.to}, output VAT of ₦${data.outputVAT.toLocaleString('en-NG', { minimumFractionDigits: 2 })} was collected on ${data.outputTransactions} sales transactions. Input VAT of ₦${data.inputVAT.toLocaleString('en-NG', { minimumFractionDigits: 2 })} was recoverable on ${data.inputTransactions} purchase transactions. Net VAT ${data.vatPayable >= 0 ? 'payable to FIRS' : 'credit'} is ₦${Math.abs(data.vatPayable).toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BUDGET VARIANCE EXPLANATION
// ─────────────────────────────────────────────────────────────────────────────

export async function explainBudgetVariance(line: {
  accountName: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number;
  topTransactions?: Array<{ date: string; description: string; amount: number }>;
}): Promise<string> {
  const dir = line.actual > line.budgeted ? 'over' : 'under';
  const txSample = (line.topTransactions ?? [])
    .slice(0, 3)
    .map(t => `  - ${t.date}: ${t.description} ₦${t.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
    .join('\n');

  const prompt = `Write one short sentence (max 20 words) explaining why a Nigerian SME is ${dir} budget on "${line.accountName}".

Budgeted: ₦${line.budgeted.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Actual:   ₦${line.actual.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Variance: ${line.variancePct.toFixed(1)}% ${dir} budget
${txSample ? `Recent transactions:\n${txSample}` : ''}

Write ONLY the one-sentence explanation.`;

  try {
    const text = await chatCompletionText({ messages: [{ role: 'user', content: prompt }], maxTokens: 80, temperature: 0.3 });
    return text.trim().replace(/^["']|["']$/g, '');
  } catch {
    return `${line.accountName} is ${Math.abs(line.variancePct).toFixed(0)}% ${dir} budget this period.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CASH FLOW FORECASTING (rule-based projection)
// ─────────────────────────────────────────────────────────────────────────────

export interface CashFlowForecast {
  projectedBalance: number;
  dailyProjections: Array<{ date: string; projectedCash: number; note?: string }>;
  alerts: Array<{ date: string; message: string; severity: 'warning' | 'critical' }>;
  confidence: 'high' | 'medium' | 'low';
}

export function projectCashFlow(params: {
  currentCashBalance: number;
  monthlyInflows:  number;  // avg monthly cash receipts
  monthlyOutflows: number;  // avg monthly cash payments
  recurringItems: Array<{ name: string; amount: number; nextDate: string; isInflow: boolean }>;
  forecastDays: number;
}): CashFlowForecast {
  const { currentCashBalance, monthlyInflows, monthlyOutflows, recurringItems, forecastDays } = params;

  const dailyNet    = (monthlyInflows - monthlyOutflows) / 30;
  const projections: Array<{ date: string; projectedCash: number; note?: string }> = [];
  const alerts:      Array<{ date: string; message: string; severity: 'warning' | 'critical' }> = [];

  let balance = currentCashBalance;
  const today = new Date();

  for (let i = 1; i <= forecastDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    balance += dailyNet;
    let note: string | undefined;

    // Apply recurring items
    for (const item of recurringItems) {
      if (item.nextDate === dateStr) {
        balance += item.isInflow ? item.amount : -item.amount;
        note = `${item.isInflow ? '+' : '-'} ${item.name}`;
      }
    }

    if (balance < 0 && !alerts.some(a => a.date === dateStr)) {
      alerts.push({ date: dateStr, message: `Projected cash deficit of ₦${Math.abs(balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, severity: 'critical' });
    } else if (balance < monthlyOutflows * 0.5 && !alerts.some(a => a.severity === 'warning')) {
      alerts.push({ date: dateStr, message: `Cash dropping below half a month's expenses`, severity: 'warning' });
    }

    projections.push({ date: dateStr, projectedCash: Math.round(balance * 100) / 100, note });
  }

  const confidence: 'high' | 'medium' | 'low' =
    recurringItems.length >= 3 ? 'high' :
    recurringItems.length >= 1 ? 'medium' : 'low';

  return {
    projectedBalance: Math.round(balance * 100) / 100,
    dailyProjections: projections,
    alerts,
    confidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NATURAL LANGUAGE GL QUERY
// ─────────────────────────────────────────────────────────────────────────────

export interface NLQueryResult {
  sql?: string;
  answer: string;
  data?: any[];
}

export async function answerFinanceQuery(
  question: string,
  context: {
    tenantId: string;
    accounts: Array<{ id: string; code: string; name: string; accountType: string }>;
    dateRange?: { from: string; to: string };
  },
): Promise<NLQueryResult> {
  const accountIndex = context.accounts
    .slice(0, 40) // keep prompt small for 3B model
    .map(a => `${a.code}: ${a.name} (${a.accountType})`)
    .join('\n');

  const prompt = `You are a finance assistant for an African SME. Answer the user's question using the account index below. Give a concise, direct answer in 1–2 sentences. If you need numbers, describe what data to look for — do NOT invent figures.

Available GL accounts:
${accountIndex}

User question: ${question}

Answer:`;

  try {
    const answer = await chatCompletionText({ messages: [{ role: 'user', content: prompt }], maxTokens: 200, temperature: 0.2 });
    return { answer: answer.trim() };
  } catch {
    return { answer: "I couldn't process that query right now. Please try again or navigate to the relevant report." };
  }
}
