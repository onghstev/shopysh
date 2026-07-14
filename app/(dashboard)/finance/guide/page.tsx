'use client';

import { useState } from 'react';
import { ChevronLeft, Printer, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardMockup, ChartOfAccountsMockup, JournalEntriesMockup,
  SalesBookMockup, PurchaseBookMockup, CashBookMockup, BankBookMockup,
  VendorsMockup, DebtorsMockup, CreditorsMockup, ExpensesMockup,
  FixedAssetsMockup, BankReconciliationMockup, BudgetMockup, RecurringJournalsMockup,
} from '@/components/finance/screen-mockups';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
      <span className="font-bold flex-shrink-0">💡 Tip:</span>
      <span>{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-xs text-sky-800">
      <span className="font-bold flex-shrink-0">ℹ️ Note:</span>
      <span>{children}</span>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h4>
      {children}
    </div>
  );
}

interface Section {
  id: string; title: string; icon: string; mockup: React.ReactNode; content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard', title: '1. Finance Dashboard', icon: '📊',
    mockup: <DashboardMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Your central command centre — real-time KPIs, trend charts, recent activity, and quick links to every finance feature, all on one screen.</p>
        <Sub title="Key Metrics">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Revenue YTD</strong> — total income recorded in the current year</li>
            <li><strong>Expenses YTD</strong> — total costs with trend vs last month</li>
            <li><strong>Net Profit</strong> — Revenue minus Expenses with margin %</li>
            <li><strong>Cash Balance</strong> — live cash account balance</li>
            <li><strong>Receivables (AR)</strong> — total outstanding customer invoices</li>
            <li><strong>Payables (AP)</strong> — total outstanding vendor bills</li>
            <li><strong>Fixed Assets NBV</strong> — net book value of all active assets</li>
          </ul>
        </Sub>
        <Sub title="How to Use">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Dashboard</strong>.</Step>
            <Step n={2}>Review the KPI cards — a coloured arrow shows the trend versus last month.</Step>
            <Step n={3}>Check the <strong>Revenue vs Expenses</strong> bar chart for the 6-month trend.</Step>
            <Step n={4}>Review <strong>Recent Journals</strong> to see the latest posted entries.</Step>
            <Step n={5}>If there are overdue receivables, a red alert banner appears — click it to go to Debtors.</Step>
          </div>
        </Sub>
        <Tip>If your GL Posting Mode is set to <strong>End-of-Day (EOD)</strong>, a "Run EOD Post" button appears top-right. Click it at the end of each business day to batch-post all draft journal entries.</Tip>
      </div>
    ),
  },
  {
    id: 'accounts', title: '2. Chart of Accounts', icon: '📋',
    mockup: <ChartOfAccountsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">The master list of every ledger account in your business. All transactions post to these accounts. Use a template to be operational in minutes.</p>
        <Sub title="Account Types">
          <div className="grid grid-cols-5 gap-1.5 text-xs text-center">
            {[['ASSET','bg-sky-100 text-sky-700'],['LIABILITY','bg-amber-100 text-amber-700'],['EQUITY','bg-violet-100 text-violet-700'],['INCOME','bg-emerald-100 text-emerald-700'],['EXPENSE','bg-orange-100 text-orange-700']].map(([t,c])=>(
              <span key={t} className={`rounded-full px-2 py-1 font-semibold ${c}`}>{t}</span>
            ))}
          </div>
        </Sub>
        <Sub title="Loading a Template">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Chart of Accounts</strong>.</Step>
            <Step n={2}>Click <strong>"Load Template"</strong> and choose: <em>Nigerian Standard</em> (65 accounts, IFRS-aligned), <em>Simple Business</em> (25 accounts), or <em>Retail / Trading</em> (65 accounts with COGS).</Step>
            <Step n={3}>Confirm. Your chart is populated instantly.</Step>
          </div>
        </Sub>
        <Sub title="Adding an Account Manually">
          <div className="space-y-2">
            <Step n={1}>Click <strong>"+ Add Account"</strong>.</Step>
            <Step n={2}>Enter Account Code, Name, Type, optional Parent account and Opening Balance.</Step>
            <Step n={3}>Save.</Step>
          </div>
        </Sub>
        <Note>System-tagged accounts (CASH, BANK, AR, AP, VAT_OUTPUT, etc.) drive automatic GL posting. Do not remove these tags.</Note>
      </div>
    ),
  },
  {
    id: 'journal', title: '3. Journal Entries', icon: '📝',
    mockup: <JournalEntriesMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Every financial transaction is a journal entry with equal debits and credits. Create manually, import via CSV, or let the system post automatically.</p>
        <Sub title="Entry Types Available">
          <div className="flex flex-wrap gap-1 text-xs">
            {['General Journal','Sales Invoice','Sales Receipt','Sales Return','Credit Note','Purchase Invoice','Purchase Payment','Cash Receipt','Cash Payment','Bank Deposit','Bank Withdrawal','Bank Transfer','Expense Claim','Opening Balance','Closing Entry'].map(t=>(
              <span key={t} className="bg-muted/50 rounded px-2 py-0.5">{t}</span>
            ))}
          </div>
        </Sub>
        <Sub title="Creating a Manual Journal">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Journal Entries</strong> and click <strong>"+ New Entry"</strong>.</Step>
            <Step n={2}>Select entry type, date, and description/reference.</Step>
            <Step n={3}>Add debit and credit lines — the running balance must reach zero before posting.</Step>
            <Step n={4}>Click <strong>Save as Draft</strong> to review later, or <strong>Post</strong> to finalise.</Step>
          </div>
        </Sub>
        <Sub title="CSV Import">
          <div className="space-y-2">
            <Step n={1}>Click <strong>"Import CSV"</strong> and download the template.</Step>
            <Step n={2}>Fill columns: date, description, account code, debit, credit, reference.</Step>
            <Step n={3}>Upload the file — the system groups rows by date + description and validates balance.</Step>
            <Step n={4}>Review the preview and click <strong>Confirm Import</strong>.</Step>
          </div>
        </Sub>
        <Tip>Use the <strong>EOD batch post</strong> button on the Finance Dashboard to post all drafts at once instead of one at a time.</Tip>
      </div>
    ),
  },
  {
    id: 'sales', title: '4. Sales Book', icon: '🧾',
    mockup: <SalesBookMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Records all sales — credit invoices and cash receipts — with automatic VAT calculation, customer lookup, and printable invoice/receipt documents.</p>
        <Sub title="Transaction Types">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Sales Invoice</strong> — on-credit sale; creates a debtor (AR) entry</li>
            <li><strong>Sales Receipt</strong> — immediate cash or bank payment received</li>
            <li><strong>Credit Note</strong> — reversal or reduction on a previous invoice</li>
          </ul>
        </Sub>
        <Sub title="Recording a Sale">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Sales Book</strong> and click <strong>"+ Record Sale"</strong>.</Step>
            <Step n={2}>Choose type (Invoice or Receipt). Select the customer.</Step>
            <Step n={3}>Add line items: description, quantity, unit price. VAT (7.5%) is calculated automatically.</Step>
            <Step n={4}>Choose payment method for receipts (Cash, Bank, Mobile Money).</Step>
            <Step n={5}>Click <strong>Save & Post</strong>. Journal entries are created automatically.</Step>
          </div>
        </Sub>
        <Sub title="Printing an Invoice">
          <div className="space-y-2">
            <Step n={1}>Find the entry in the list and click the <strong>Print</strong> icon.</Step>
            <Step n={2}>A formatted invoice opens. Use Print / Save as PDF in your browser.</Step>
          </div>
        </Sub>
        <Tip>Sales Invoices feed into the AR aging report automatically. Always record credit sales here — not just in the journal — so debtor balances are tracked.</Tip>
      </div>
    ),
  },
  {
    id: 'purchase', title: '5. Purchase Book', icon: '🛒',
    mockup: <PurchaseBookMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Records supplier bills and payments, feeding into your Accounts Payable balance and enabling vendor payment planning.</p>
        <Sub title="Transaction Types">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Purchase Invoice</strong> — supplier bill received on credit</li>
            <li><strong>Purchase Payment</strong> — payment made to a supplier</li>
            <li><strong>Debit Note</strong> — reduction on a supplier invoice (e.g. returned goods)</li>
          </ul>
        </Sub>
        <Sub title="Recording a Purchase">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Purchase Book</strong> and click <strong>"+ Record Purchase"</strong>.</Step>
            <Step n={2}>Select the vendor from the lookup. Enter supplier invoice number and date.</Step>
            <Step n={3}>Add line items and select the expense account for each line.</Step>
            <Step n={4}>Save & Post — the AP journal entry is created automatically.</Step>
          </div>
        </Sub>
        <Note>Recording a Payment against a Purchase Invoice reduces the AP balance automatically. Always record payments here — not just as a cash payment journal.</Note>
      </div>
    ),
  },
  {
    id: 'cashbook', title: '6. Cash Book', icon: '💵',
    mockup: <CashBookMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">A dedicated running-balance ledger for all cash movements — opening balance, every receipt and payment, and closing balance for any date range.</p>
        <Sub title="Using the Cash Book">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Cash Book</strong>.</Step>
            <Step n={2}>Select a date range and click <strong>Load</strong>.</Step>
            <Step n={3}>Review: Opening Balance → Receipts (+) → Payments (−) → Closing Balance with running total per row.</Step>
            <Step n={4}>Click <strong>Print</strong> for a formatted report with your company header.</Step>
          </div>
        </Sub>
        <Note>The Cash Book is a read-only view of posted GL entries. To add cash movements, use the Journal Entries, Sales Book, or Expenses screens.</Note>
        <Tip>Cross-check the Cash Book closing balance against your physical till count at end of day. Any discrepancy needs a cash reconciliation journal.</Tip>
      </div>
    ),
  },
  {
    id: 'bankbook', title: '7. Bank Book', icon: '🏦',
    mockup: <BankBookMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Per-account bank ledger with running balance — supports multiple bank accounts with a tab-switcher at the top.</p>
        <Sub title="Using the Bank Book">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Bank Book</strong>.</Step>
            <Step n={2}>If you have multiple accounts, select the account from the tabs (GTBank Current, Opay Wallet, etc.).</Step>
            <Step n={3}>Set the date range. The report shows deposits, withdrawals, transfers, and a running balance per row.</Step>
            <Step n={4}>Print or export as a statement for the selected account and period.</Step>
          </div>
        </Sub>
        <Tip>Use the Bank Book alongside your bank statement during Bank Reconciliation — open both side by side to spot differences quickly.</Tip>
      </div>
    ),
  },
  {
    id: 'vendors', title: '8. Vendors', icon: '🏢',
    mockup: <VendorsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Master data for all suppliers. Vendor records link to Purchase Book entries and feed the AP aging report.</p>
        <Sub title="Managing Vendors">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Vendors</strong>.</Step>
            <Step n={2}>Click <strong>"+ Add Vendor"</strong> and fill in: Name, Email, Phone, Address, Tax ID, Payment Terms.</Step>
            <Step n={3}>Save. The vendor is now available in the Purchase Book lookup.</Step>
            <Step n={4}>The <strong>Outstanding AP</strong> column shows the live balance owed to each vendor.</Step>
          </div>
        </Sub>
        <Tip>Adding a Tax ID (RC number) for each vendor is useful when generating tax reports or responding to FIRS queries. Enter it when setting up the vendor to avoid hunting for it later.</Tip>
      </div>
    ),
  },
  {
    id: 'ar', title: '9. Debtors / Accounts Receivable', icon: '📥',
    mockup: <DebtorsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Shows all money owed to you by customers, organised into four aging buckets so you can prioritise collections and protect cash flow.</p>
        <Sub title="Aging Buckets">
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            {[['Current','0–30 days','bg-emerald-50 text-emerald-700'],['31–60 Days','Early overdue','bg-amber-50 text-amber-700'],['61–90 Days','Overdue','bg-orange-50 text-orange-700'],['90+ Days','Critical','bg-red-50 text-red-700']].map(([a,b,c])=>(
              <div key={a} className={`rounded-lg p-2 ${c}`}><p className="font-bold">{a}</p><p className="opacity-70">{b}</p></div>
            ))}
          </div>
        </Sub>
        <Sub title="Using the AR Module">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Debtors / AR</strong>.</Step>
            <Step n={2}>Review summary cards — Total AR plus breakdown by aging bucket.</Step>
            <Step n={3}>The table shows each customer with their balance split across all four buckets.</Step>
            <Step n={4}>Click <strong>Export CSV</strong> for your accountant, bank, or collections team.</Step>
          </div>
        </Sub>
        <Tip>The Finance Dashboard shows an overdue AR alert (30+ days). Check it daily — every week without follow-up increases the risk of write-off.</Tip>
      </div>
    ),
  },
  {
    id: 'ap', title: '10. Creditors / Accounts Payable', icon: '📤',
    mockup: <CreditorsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Tracks all money owed to suppliers, helping you manage payment schedules and maintain vendor relationships.</p>
        <Sub title="Using the AP Module">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Creditors / AP</strong>.</Step>
            <Step n={2}>Review aging buckets — same structure as AR but for amounts you owe.</Step>
            <Step n={3}>Prioritise paying vendors in the 61–90 and 90+ day buckets to protect trade credit.</Step>
            <Step n={4}>Export CSV to share with your team for payment planning or cash flow scheduling.</Step>
          </div>
        </Sub>
        <Note>AP balances come from Purchase Invoices in the Purchase Book. Recording a Purchase Payment reduces the balance immediately.</Note>
      </div>
    ),
  },
  {
    id: 'expenses', title: '11. Expenses', icon: '💳',
    mockup: <ExpensesMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Record, categorise, and analyse business costs. Features a built-in category breakdown bar chart and CSV export for tax preparation.</p>
        <Sub title="Recording an Expense">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Expenses</strong> and click <strong>"+ Add Expense"</strong>.</Step>
            <Step n={2}>Enter: Date, Amount, Description, Category (or create one), Vendor (optional), Payment Method.</Step>
            <Step n={3}>Save — the GL entry is created automatically.</Step>
          </div>
        </Sub>
        <Sub title="Analysing Expenses">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li>Use the date range filter to scope the view (This Month, This Year, Custom).</li>
            <li>The horizontal bar chart shows spending by category instantly.</li>
            <li>Filter by category to drill into a specific cost type.</li>
            <li>Export CSV for reporting or tax filing.</li>
          </ul>
        </Sub>
        <Tip>Choosing <strong>On Credit</strong> as the payment method records the expense against AP — useful when you've received goods but haven't paid yet.</Tip>
      </div>
    ),
  },
  {
    id: 'assets', title: '12. Fixed Assets', icon: '🏗️',
    mockup: <FixedAssetsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Manages all long-term business assets — computers, vehicles, buildings, machinery — tracking acquisition cost, depreciation, salvage value, and net book value.</p>
        <Sub title="Adding a New Asset">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Fixed Assets</strong> and click <strong>"+ Add Asset"</strong>.</Step>
            <Step n={2}>Enter: Name, Category, Purchase Date, Acquisition Cost, Salvage Value, Useful Life (years), Location, Serial Number.</Step>
            <Step n={3}>Select depreciation method: <strong>Straight-Line</strong> (equal monthly amounts) or <strong>Reducing Balance</strong>.</Step>
            <Step n={4}>Save — the asset appears in the Asset Register tab.</Step>
          </div>
        </Sub>
        <Sub title="Running Depreciation">
          <div className="space-y-2">
            <Step n={1}>Go to the <strong>Depreciation</strong> tab.</Step>
            <Step n={2}>Click <strong>Depreciate</strong> on a single asset row for one period, or click <strong>"Run Batch Depreciation"</strong> for all active assets.</Step>
            <Step n={3}>GL entries are posted automatically: Dr Depreciation Expense / Cr Accumulated Depreciation.</Step>
          </div>
        </Sub>
        <Sub title="Fixed Assets Report">
          <p className="text-sm text-foreground/80">Go to <strong>Finance → Reports → Fixed Assets Register</strong> for a printable report showing Acquisition Cost, Accumulated Depreciation, Salvage Value, Net Book Value, and Monthly Depreciation per asset.</p>
        </Sub>
        <Tip>Monthly Depreciation (Straight-Line) = <code className="bg-muted px-1 rounded text-xs">(Acquisition Cost − Salvage Value) ÷ (Useful Life × 12)</code></Tip>
      </div>
    ),
  },
  {
    id: 'recon', title: '13. Bank Reconciliation', icon: '🔗',
    mockup: <BankReconciliationMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Matches your bank statement transactions to GL journal entries. AI auto-matching reduces reconciliation from hours to minutes.</p>
        <Sub title="Importing a Bank Statement">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Bank Reconciliation</strong> and click <strong>"Import Statement"</strong>.</Step>
            <Step n={2}>Upload your bank CSV (exported from online banking). Map columns: Date, Description, Debit, Credit, Balance.</Step>
            <Step n={3}>Enter the statement date, opening balance, and closing balance. Click <strong>Import</strong>.</Step>
          </div>
        </Sub>
        <Sub title="Matching Transactions">
          <div className="space-y-2">
            <Step n={1}>Click <strong>"Auto-Match AI"</strong> — the system suggests matches by amount, date, and description.</Step>
            <Step n={2}>Review AI suggestions — accept or reject each one.</Step>
            <Step n={3}>For remaining items, manually click to match a bank line to a GL entry.</Step>
            <Step n={4}>For bank-only items (charges, interest), create a new journal directly from this screen.</Step>
            <Step n={5}>When all items are matched or "Ignored", the reconciliation is marked <strong>Complete</strong>.</Step>
          </div>
        </Sub>
        <Note>The reconciliation is only truly complete when the bank statement closing balance equals the GL-calculated closing balance. The system verifies this automatically.</Note>
      </div>
    ),
  },
  {
    id: 'budget', title: '14. Budget vs Actuals', icon: '🎯',
    mockup: <BudgetMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Set income and expense targets per account and track real-time performance against them throughout the year. AI explains significant variances.</p>
        <Sub title="Creating a Budget">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Budget</strong> and click <strong>"+ New Budget"</strong>.</Step>
            <Step n={2}>Name it (e.g. "FY 2025 Operating Budget") and select the fiscal year.</Step>
            <Step n={3}>Enter budgeted amounts per account. Save.</Step>
          </div>
        </Sub>
        <Sub title="Reading the Report">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li>Each row shows: Account, Annual Budget, YTD Actual, Variance, and a % Used progress bar.</li>
            <li>Red rows = over budget; green = under budget or ahead of revenue target.</li>
            <li>Lines with &gt;10% variance show an <strong>"Ask AI"</strong> button for an explanation.</li>
          </ul>
        </Sub>
        <Tip>Print the Budget vs Actuals report for board meetings — go to <strong>Finance → Reports → Budget vs Actuals</strong> for the printable version with your company header.</Tip>
      </div>
    ),
  },
  {
    id: 'recurring', title: '15. Recurring Journals', icon: '🔄',
    mockup: <RecurringJournalsMockup />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">Automate repetitive entries — rent, loan repayments, utilities, salaries — so they post on schedule without manual effort.</p>
        <Sub title="Setting Up a Recurring Entry">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Recurring Journals</strong> and click <strong>"+ New Recurring"</strong>.</Step>
            <Step n={2}>Give it a name, select frequency (Daily / Weekly / Monthly / Quarterly / Yearly) and day of month.</Step>
            <Step n={3}>Add debit and credit journal lines (same as a regular journal entry).</Step>
            <Step n={4}>Set an optional End Date. Toggle <strong>Active</strong> on — it will run automatically on the next due date.</Step>
          </div>
        </Sub>
        <Tip>Recurring journals also improve the accuracy of the Cash Flow Forecast — the system factors in your known recurring outflows when projecting future balances up to 90 days ahead.</Tip>
      </div>
    ),
  },
];

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={section.id} className="border border-border rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <span className="font-semibold text-base">{section.title}</span>
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 py-5 bg-card border-t border-border space-y-5">
          {/* Screen mockup */}
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
            {section.mockup}
          </div>
          {/* Instructions */}
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function FinanceGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/finance">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Finance</Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Finance Module — User Guide</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />Print
        </Button>
      </div>

      {/* Intro */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-base mb-2">About This Guide</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each section below shows a live screen preview followed by step-by-step instructions. Click any section to expand it.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          {[['15','Screens Covered'],['13','Report Types'],['15+','Entry Types'],['5','AI-Powered Features']].map(([n,l])=>(
            <div key={l} className="bg-muted/40 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{n}</p>
              <p className="text-muted-foreground mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TOC */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Contents</h2>
        <div className="grid sm:grid-cols-3 gap-1">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="text-sm text-primary hover:underline flex items-center gap-2 py-0.5"
              onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior:'smooth' }); }}>
              <span>{s.icon}</span>{s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map(s => <AccordionSection key={s.id} section={s} />)}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Shopysh Finance Module User Guide · Updated July 2026
      </div>
    </div>
  );
}
