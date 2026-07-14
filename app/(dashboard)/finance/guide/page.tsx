'use client';

import { useState } from 'react';
import { ChevronLeft, Printer, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

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
      <span className="text-amber-500 font-bold flex-shrink-0">💡 Tip:</span>
      <span>{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-xs text-sky-800">
      <span className="text-sky-500 font-bold flex-shrink-0">ℹ️ Note:</span>
      <span>{children}</span>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h4>
      {children}
    </div>
  );
}

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
          {section.content}
        </div>
      )}
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    title: '1. Finance Dashboard',
    icon: '📊',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Finance Dashboard is your central command centre. It shows real-time KPIs, recent activity, and quick links to all finance features.
        </p>
        <SubSection title="Key Metrics Displayed">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Revenue (YTD)</strong> — total income recorded in the current year</li>
            <li><strong>Expenses (YTD)</strong> — total costs recorded in the current year</li>
            <li><strong>Net Profit</strong> — Revenue minus Expenses with margin %</li>
            <li><strong>Cash Balance</strong> — current cash account balance</li>
            <li><strong>Receivables (AR)</strong> — total outstanding customer invoices</li>
            <li><strong>Payables (AP)</strong> — total outstanding vendor bills</li>
            <li><strong>Fixed Assets</strong> — net book value of all active assets</li>
          </ul>
        </SubSection>
        <SubSection title="How to Use">
          <div className="space-y-2">
            <Step n={1}>Navigate to <strong>Finance → Dashboard</strong> from the sidebar.</Step>
            <Step n={2}>Review the KPI cards at the top. A red/green arrow shows the trend versus last month.</Step>
            <Step n={3}>Check the <strong>Revenue vs Expenses</strong> bar chart for a 6-month trend view.</Step>
            <Step n={4}>Review <strong>Recent Journals</strong> to see the latest posted entries.</Step>
            <Step n={5}>If there are overdue receivables, a red alert banner shows the total and count. Click it to go straight to Debtors.</Step>
          </div>
        </SubSection>
        <Tip>If your GL Posting Mode is set to <strong>End-of-Day (EOD)</strong>, a "Run EOD Post" button appears on the dashboard. Click it at the end of each business day to batch-post all draft journal entries.</Tip>
      </div>
    ),
  },
  {
    id: 'chart-of-accounts',
    title: '2. Chart of Accounts',
    icon: '📋',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Chart of Accounts (COA) is the master list of every ledger account in your business. All transactions post to these accounts. You can use a template or build your own from scratch.
        </p>
        <SubSection title="Account Types">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>ASSET</strong> — cash, bank, receivables, fixed assets, inventory</li>
            <li><strong>LIABILITY</strong> — payables, loans, tax payable</li>
            <li><strong>EQUITY</strong> — owner's capital, retained earnings</li>
            <li><strong>INCOME</strong> — sales, service revenue, other income</li>
            <li><strong>EXPENSE</strong> — salaries, rent, utilities, depreciation</li>
          </ul>
        </SubSection>
        <SubSection title="Loading a Template">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Chart of Accounts</strong>.</Step>
            <Step n={2}>Click <strong>"Load Template"</strong> and choose one of three options:
              <ul className="mt-1 ml-4 text-xs list-disc list-inside text-muted-foreground">
                <li><strong>Nigerian Standard</strong> (65 accounts) — IFRS-aligned, suitable for most Nigerian businesses</li>
                <li><strong>Simple Business</strong> (25 accounts) — minimal setup for sole traders</li>
                <li><strong>Retail / Trading</strong> (65 accounts) — includes COGS and inventory accounts</li>
              </ul>
            </Step>
            <Step n={3}>Confirm. Existing accounts will be replaced with the template.</Step>
          </div>
        </SubSection>
        <SubSection title="Creating an Account Manually">
          <div className="space-y-2">
            <Step n={1}>Click <strong>"+ Add Account"</strong>.</Step>
            <Step n={2}>Enter: Account Code (e.g. 1110), Account Name, Type, and optionally a parent account and opening balance.</Step>
            <Step n={3}>Click <strong>Save</strong>.</Step>
          </div>
        </SubSection>
        <Note>System-tagged accounts (CASH, BANK, AR, AP, VAT_OUTPUT, etc.) are used by automatic GL posting. Do not delete these tags — they drive the auto-post logic.</Note>
        <Tip>Use a parent account to group sub-accounts (e.g. create "Bank Accounts" as a parent, then add "GTBank Current" and "Opay Wallet" as children).</Tip>
      </div>
    ),
  },
  {
    id: 'journal',
    title: '3. Journal Entries',
    icon: '📝',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Journal Entries are the foundation of double-entry bookkeeping. Every financial transaction must have equal debits and credits. You can create entries manually, import via CSV, or let the system post them automatically.
        </p>
        <SubSection title="Entry Types Available">
          <div className="grid grid-cols-2 gap-1 text-xs text-foreground/80">
            {[
              'General Journal','Sales Invoice','Sales Receipt','Sales Return',
              'Credit Note','Purchase Invoice','Purchase Payment','Cash Receipt',
              'Cash Payment','Bank Deposit','Bank Withdrawal','Bank Transfer',
              'Expense Claim','Opening Balance','Closing Entry',
            ].map(t => (
              <span key={t} className="bg-muted/40 rounded px-2 py-0.5">{t}</span>
            ))}
          </div>
        </SubSection>
        <SubSection title="Creating a Manual Journal">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Journal Entries</strong>.</Step>
            <Step n={2}>Click <strong>"+ New Entry"</strong>.</Step>
            <Step n={3}>Select the entry type, date, and add a description/reference.</Step>
            <Step n={4}>Add debit and credit lines. The system shows a running balance — it must equal zero before saving.</Step>
            <Step n={5}>Click <strong>Save as Draft</strong> to review later, or <strong>Post</strong> to finalise.</Step>
          </div>
        </SubSection>
        <SubSection title="Importing Journals via CSV">
          <div className="space-y-2">
            <Step n={1}>Click <strong>"Import CSV"</strong> and download the template first.</Step>
            <Step n={2}>Fill in: date, description, account code, debit, credit, reference.</Step>
            <Step n={3}>Upload the file. The system groups rows by date + description and validates balance.</Step>
            <Step n={4}>Review the preview and click <strong>Confirm Import</strong>.</Step>
          </div>
        </SubSection>
        <SubSection title="Entry Status Workflow">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {['DRAFT', '→', 'POSTED', '→', 'REVERSED / CANCELLED'].map((s, i) => (
              <span key={i} className={s.startsWith('→') ? 'text-muted-foreground' : 'bg-muted rounded px-2 py-0.5 font-mono'}>{s}</span>
            ))}
          </div>
        </SubSection>
        <Tip>Use the End-of-Day (EOD) batch post button on the Finance Dashboard to post all draft entries at once instead of posting one by one.</Tip>
      </div>
    ),
  },
  {
    id: 'sales-book',
    title: '4. Sales Book',
    icon: '🧾',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Sales Book records all sales transactions — both credit invoices and cash receipts. It is separate from the storefront order system and is used for formal accounting entries.
        </p>
        <SubSection title="Transaction Types">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Sales Invoice</strong> — on-credit sale; creates a debtor (AR) entry</li>
            <li><strong>Sales Receipt</strong> — immediate cash or bank payment</li>
            <li><strong>Credit Note</strong> — reversal or reduction on a previous invoice</li>
          </ul>
        </SubSection>
        <SubSection title="Recording a Sale">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Sales Book</strong>.</Step>
            <Step n={2}>Click <strong>"+ Record Sale"</strong> and choose the type (Invoice or Receipt).</Step>
            <Step n={3}>Select the customer (or type a name for a one-off sale).</Step>
            <Step n={4}>Add line items: description, quantity, unit price. VAT is calculated automatically.</Step>
            <Step n={5}>Choose the payment method for receipts (Cash, Bank Transfer, Mobile Money, Card).</Step>
            <Step n={6}>Click <strong>Save & Post</strong>. The journal entries are created automatically.</Step>
          </div>
        </SubSection>
        <SubSection title="Printing Invoices & Receipts">
          <div className="space-y-2">
            <Step n={1}>Find the entry in the Sales Book list.</Step>
            <Step n={2}>Click the <strong>Print</strong> icon on the row.</Step>
            <Step n={3}>A formatted invoice/receipt opens. Use your browser's Print dialog to print or save as PDF.</Step>
          </div>
        </SubSection>
        <Tip>The Sales Book feeds into the Accounts Receivable aging report. Always record credit sales here so overdue balances are tracked automatically.</Tip>
      </div>
    ),
  },
  {
    id: 'purchase-book',
    title: '5. Purchase Book',
    icon: '🛒',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Purchase Book records supplier bills and payments. It mirrors the Sales Book but from the vendor side, feeding into your Accounts Payable balance.
        </p>
        <SubSection title="Transaction Types">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Purchase Invoice</strong> — bill received from a supplier on credit</li>
            <li><strong>Purchase Payment</strong> — payment made to a supplier</li>
            <li><strong>Debit Note</strong> — reduction on a supplier invoice (e.g. returned goods)</li>
          </ul>
        </SubSection>
        <SubSection title="Recording a Purchase">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Purchase Book</strong>.</Step>
            <Step n={2}>Click <strong>"+ Record Purchase"</strong>.</Step>
            <Step n={3}>Select the vendor from the lookup (or add a new vendor inline).</Step>
            <Step n={4}>Enter the supplier invoice number, date, and line items.</Step>
            <Step n={5}>Select expense account for each line (e.g. Stock Purchases, Office Supplies).</Step>
            <Step n={6}>Save & Post to create the AP journal entry.</Step>
          </div>
        </SubSection>
        <Note>When you record a Payment against a Purchase Invoice, the system reduces the AP balance automatically. Always record payments here — do not just create a cash payment journal manually.</Note>
      </div>
    ),
  },
  {
    id: 'cash-bank',
    title: '6. Cash Book & Bank Book',
    icon: '💵',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Cash Book and Bank Book are dedicated ledgers that show all movements through your cash account and bank accounts respectively, with running balances.
        </p>
        <SubSection title="Cash Book">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Cash Book</strong>.</Step>
            <Step n={2}>Select a date range and click <strong>Load</strong>.</Step>
            <Step n={3}>The report shows: Opening Balance, all Receipts (+), all Payments (−), and Closing Balance.</Step>
            <Step n={4}>Each row shows a running balance. Click <strong>Print</strong> for a formatted cash book report.</Step>
          </div>
        </SubSection>
        <SubSection title="Bank Book">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Bank Book</strong>.</Step>
            <Step n={2}>If you have multiple bank accounts, select the account from the tab switcher at the top.</Step>
            <Step n={3}>Select your date range. The report shows deposits, withdrawals, transfers, and a running balance.</Step>
            <Step n={4}>Use this alongside your bank statement during Bank Reconciliation.</Step>
          </div>
        </SubSection>
        <Tip>The Cash Book and Bank Book automatically pull from posted GL entries. They are read-only views — to add entries, use the Journal, Sales Book, or Purchase Book.</Tip>
      </div>
    ),
  },
  {
    id: 'ar',
    title: '7. Debtors / Accounts Receivable',
    icon: '📥',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Debtors (AR) module tracks all money owed to you by customers. It organises outstanding balances by age so you can prioritise collections.
        </p>
        <SubSection title="Aging Buckets">
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            {[['Current', '0–30 days', 'bg-emerald-50 text-emerald-700'], ['31–60 Days', 'Early overdue', 'bg-amber-50 text-amber-700'], ['61–90 Days', 'Overdue', 'bg-orange-50 text-orange-700'], ['90+ Days', 'Severely overdue', 'bg-red-50 text-red-700']].map(([a, b, c]) => (
              <div key={a} className={`rounded-lg p-2 ${c}`}>
                <p className="font-bold">{a}</p>
                <p className="opacity-70">{b}</p>
              </div>
            ))}
          </div>
        </SubSection>
        <SubSection title="Using the AR Module">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Debtors / AR</strong>.</Step>
            <Step n={2}>Review the summary cards: Total AR, and the breakdown by aging bucket.</Step>
            <Step n={3}>The table shows each customer, their total balance, and how much falls in each aging bucket.</Step>
            <Step n={4}>Click <strong>Export CSV</strong> to download the aging report for your accountant or bank.</Step>
          </div>
        </SubSection>
        <Note>AR balances are populated automatically from Sales Invoices recorded in the Sales Book. When a customer payment is recorded, it reduces the balance.</Note>
        <Tip>The Finance Dashboard shows an overdue AR alert (balances 30+ days). This is a quick indicator — check it daily.</Tip>
      </div>
    ),
  },
  {
    id: 'ap',
    title: '8. Creditors / Accounts Payable',
    icon: '📤',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Creditors (AP) module tracks all money you owe to suppliers and vendors, helping you manage payment schedules and cash flow.
        </p>
        <SubSection title="Using the AP Module">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Creditors / AP</strong>.</Step>
            <Step n={2}>Review the aging buckets — same structure as AR but for amounts owed.</Step>
            <Step n={3}>Prioritise paying suppliers in the <strong>61–90 Days</strong> and <strong>90+ Days</strong> buckets to maintain vendor relationships.</Step>
            <Step n={4}>Export CSV to share with your finance team for payment planning.</Step>
          </div>
        </SubSection>
        <Note>AP balances come from Purchase Invoices. When you record a Purchase Payment in the Purchase Book, the AP balance decreases.</Note>
      </div>
    ),
  },
  {
    id: 'vendors-customers',
    title: '9. Vendors & Customers',
    icon: '👥',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Maintain master data for your suppliers (Vendors) and buyers (Customers). These records are linked to purchase and sales transactions respectively.
        </p>
        <SubSection title="Managing Vendors">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Vendors</strong>.</Step>
            <Step n={2}>Click <strong>"+ Add Vendor"</strong> and fill in: Name, Email, Phone, Address, Tax ID, Payment Terms.</Step>
            <Step n={3}>Save. The vendor is now available in the Purchase Book lookup.</Step>
            <Step n={4}>To edit, click the pencil icon on any vendor row.</Step>
          </div>
        </SubSection>
        <SubSection title="Managing Customers">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Customers</strong>.</Step>
            <Step n={2}>Add customer details including credit limit.</Step>
            <Step n={3}>The customer is available in the Sales Book and AR module.</Step>
          </div>
        </SubSection>
        <Tip>Finance Customers are separate from Storefront Customers. Finance customers are B2B accounts you invoice; storefront customers place orders on your public shop.</Tip>
      </div>
    ),
  },
  {
    id: 'expenses',
    title: '10. Expenses',
    icon: '💳',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Expenses module provides a simple way to record and categorise business costs, with a built-in breakdown chart for quick analysis.
        </p>
        <SubSection title="Recording an Expense">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Expenses</strong>.</Step>
            <Step n={2}>Click <strong>"+ Add Expense"</strong>.</Step>
            <Step n={3}>Enter: Date, Amount, Description, Category (or create a new one), Vendor (optional), Payment Method.</Step>
            <Step n={4}>Save. The expense is recorded and the GL entry is created automatically.</Step>
          </div>
        </SubSection>
        <SubSection title="Analysing Expenses">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li>Use the date range filter (This Month, Last Month, This Year, Custom) to scope your view.</li>
            <li>The bar chart shows spending by category — quickly spot where money is going.</li>
            <li>Filter by category to drill into a specific cost type.</li>
            <li>Click <strong>Export CSV</strong> to download for reporting.</li>
          </ul>
        </SubSection>
        <SubSection title="Payment Methods">
          <div className="flex flex-wrap gap-2 text-xs">
            {['Cash','Bank Transfer','Card','Mobile Money','On Credit'].map(m => (
              <span key={m} className="bg-muted rounded px-2 py-0.5">{m}</span>
            ))}
          </div>
        </SubSection>
        <Tip>Selecting <strong>On Credit</strong> as the payment method records the expense against Accounts Payable — useful when you have received goods/services but haven't paid yet.</Tip>
      </div>
    ),
  },
  {
    id: 'fixed-assets',
    title: '11. Fixed Assets',
    icon: '🏗️',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Fixed Assets module manages your long-term business assets — from computers to vehicles to buildings. It tracks acquisition cost, depreciation, and net book value.
        </p>
        <SubSection title="Asset Categories">
          <div className="flex flex-wrap gap-1 text-xs">
            {['Land & Buildings','Plant & Machinery','Motor Vehicles','Furniture & Fittings','Computer Equipment','Office Equipment','Tools & Equipment','Leasehold Improvements','Other'].map(c => (
              <span key={c} className="bg-muted rounded px-2 py-0.5">{c}</span>
            ))}
          </div>
        </SubSection>
        <SubSection title="Adding a New Asset">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Fixed Assets</strong>.</Step>
            <Step n={2}>Click <strong>"+ Add Asset"</strong>.</Step>
            <Step n={3}>Enter: Asset Name, Category, Purchase Date, Purchase Cost, Residual / Salvage Value, Useful Life (years), Location, Serial Number.</Step>
            <Step n={4}>Select a Depreciation Method: <strong>Straight-Line</strong> (equal monthly amounts) or <strong>Reducing Balance</strong> (higher early, lower later).</Step>
            <Step n={5}>Click <strong>Save</strong>. The asset appears in the Asset Register tab.</Step>
          </div>
        </SubSection>
        <SubSection title="Running Depreciation">
          <div className="space-y-2">
            <Step n={1}>Go to the <strong>Depreciation</strong> tab.</Step>
            <Step n={2}>To depreciate a single asset, click <strong>Depreciate</strong> on its row. This posts one period of depreciation.</Step>
            <Step n={3}>To depreciate all active assets at once, click <strong>"Run Batch Depreciation"</strong>.</Step>
            <Step n={4}>GL entries are created automatically: Dr Depreciation Expense / Cr Accumulated Depreciation.</Step>
          </div>
        </SubSection>
        <SubSection title="Disposing an Asset">
          <div className="space-y-2">
            <Step n={1}>Open the asset from the Asset Register.</Step>
            <Step n={2}>Click <strong>"Dispose Asset"</strong> and enter the disposal date and value received.</Step>
            <Step n={3}>The asset moves to the Disposals tab and the GL entry is posted.</Step>
          </div>
        </SubSection>
        <SubSection title="Fixed Assets Register Report">
          <p className="text-sm text-foreground/80">Go to <strong>Finance → Reports → Fixed Assets Register</strong> for a printable report showing: Acquisition Cost, Accumulated Depreciation, Salvage Value, Net Book Value, Monthly Depreciation, and Method — grouped by category.</p>
        </SubSection>
        <Tip>Monthly Depreciation is calculated as: <code className="bg-muted px-1 rounded text-xs">(Acquisition Cost − Salvage Value) ÷ (Useful Life in Years × 12)</code> for Straight-Line method.</Tip>
      </div>
    ),
  },
  {
    id: 'budget',
    title: '12. Budget & Planning',
    icon: '🎯',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Budget module lets you set income and expense targets for each account and track actual performance against them throughout the year.
        </p>
        <SubSection title="Creating a Budget">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Budget</strong>.</Step>
            <Step n={2}>Click <strong>"+ New Budget"</strong> and give it a name (e.g. "FY 2025 Operating Budget").</Step>
            <Step n={3}>Select the fiscal year. The system lists all income and expense accounts.</Step>
            <Step n={4}>Enter budgeted amounts for each account.</Step>
            <Step n={5}>Save. The budget is now active and tracks actuals.</Step>
          </div>
        </SubSection>
        <SubSection title="Reviewing Budget vs Actuals">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li>The table shows: Account, Budget Amount, YTD Actual, Variance, and % Utilised.</li>
            <li>Red rows indicate over-budget accounts; green rows show under-budget.</li>
            <li>A progress bar visualises the % of budget consumed.</li>
          </ul>
        </SubSection>
        <SubSection title="AI Budget Explanations">
          <div className="space-y-2">
            <Step n={1}>On any line with a significant variance (&gt;10%), a <strong>"Ask AI"</strong> button appears.</Step>
            <Step n={2}>Click it to get an AI-generated explanation of likely causes for the variance.</Step>
          </div>
        </SubSection>
        <Tip>Print the Budget vs Actuals report (<strong>Finance → Reports → Budget vs Actuals</strong>) for board meetings or investor updates.</Tip>
      </div>
    ),
  },
  {
    id: 'bank-reconciliation',
    title: '13. Bank Reconciliation',
    icon: '🔗',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bank Reconciliation matches your bank statement transactions to your GL journal entries, ensuring your books agree with your actual bank balance.
        </p>
        <SubSection title="Importing a Bank Statement">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Bank Reconciliation</strong>.</Step>
            <Step n={2}>Click <strong>"Import Statement"</strong> and upload your bank statement CSV (exported from your online banking portal).</Step>
            <Step n={3}>Map the CSV columns: Date, Description, Debit, Credit, Balance, Reference.</Step>
            <Step n={4}>Enter the statement date, opening balance, and closing balance. Click <strong>Import</strong>.</Step>
          </div>
        </SubSection>
        <SubSection title="Matching Transactions">
          <div className="space-y-2">
            <Step n={1}>The system lists bank transactions on the left and unmatched GL entries on the right.</Step>
            <Step n={2}>Click <strong>"Auto-Match"</strong> to let the AI suggest matches based on amount, date, and description.</Step>
            <Step n={3}>Review AI suggestions — accept or reject each match.</Step>
            <Step n={4}>For remaining items, drag-and-drop or click to manually match a bank line to a GL entry.</Step>
            <Step n={5}>For items that appear only in the bank (bank charges, interest) — create a new journal entry directly from the reconciliation screen.</Step>
            <Step n={6}>When all items are matched or marked as "Ignored", the reconciliation is marked <strong>Complete</strong>.</Step>
          </div>
        </SubSection>
        <Note>A reconciliation is only truly complete when the Closing Balance from the bank statement equals the Closing Balance calculated from the GL. The system shows this check at the bottom of the screen.</Note>
      </div>
    ),
  },
  {
    id: 'recurring',
    title: '14. Recurring Journals',
    icon: '🔄',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Recurring Journals automate repetitive accounting entries — such as monthly rent, loan repayments, depreciation, or salary journals — so you don't have to create them manually each period.
        </p>
        <SubSection title="Setting Up a Recurring Entry">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Recurring Journals</strong>.</Step>
            <Step n={2}>Click <strong>"+ New Recurring Journal"</strong>.</Step>
            <Step n={3}>Give it a name (e.g. "Monthly Rent"), select frequency (Daily, Weekly, Monthly, Quarterly, Yearly), and set the day of month.</Step>
            <Step n={4}>Add the journal lines (debit and credit accounts and amounts) — same as a regular journal.</Step>
            <Step n={5}>Set an optional End Date if the journal should stop after a certain date.</Step>
            <Step n={6}>Toggle <strong>Active</strong> on. The system will run it automatically on the next due date.</Step>
          </div>
        </SubSection>
        <SubSection title="Manual Trigger">
          <p className="text-sm text-foreground/80">If you need to run a recurring journal immediately (e.g. for testing or a missed period), click the <strong>Run Now</strong> button on its row.</p>
        </SubSection>
        <Tip>Recurring journals also improve the accuracy of the Cash Flow Forecast — the system factors in your known recurring outflows when projecting future balances.</Tip>
      </div>
    ),
  },
  {
    id: 'cash-forecast',
    title: '15. Cash Flow Forecast',
    icon: '🔭',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Cash Flow Forecast uses AI to project your future cash balance over 30, 60, or 90 days based on your GL history, recurring journals, and outstanding AR/AP.
        </p>
        <SubSection title="Generating a Forecast">
          <div className="space-y-2">
            <Step n={1}>Go to <strong>Finance → Cash Flow Forecast</strong>.</Step>
            <Step n={2}>Select the forecast horizon: <strong>30 days</strong>, <strong>60 days</strong>, or <strong>90 days</strong>.</Step>
            <Step n={3}>Click <strong>Generate Forecast</strong>. The AI analyses your past patterns.</Step>
            <Step n={4}>Review the projection chart and daily detail table.</Step>
            <Step n={5}>Check for any <strong>red alert</strong> days where projected cash goes negative.</Step>
          </div>
        </SubSection>
        <SubSection title="Reading the Forecast">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Current Balance</strong> — today's confirmed cash position</li>
            <li><strong>Projected Balance</strong> — AI-estimated balance at the end of the period</li>
            <li><strong>Inflow/Outflow trends</strong> — monthly bar chart showing receipts vs payments</li>
            <li><strong>Confidence Level</strong> — High/Medium/Low based on available data</li>
          </ul>
        </SubSection>
        <Tip>The more recurring journals you have set up and the more historical data in your GL, the more accurate the forecast becomes. Aim for at least 3 months of transaction history.</Tip>
      </div>
    ),
  },
  {
    id: 'reports',
    title: '16. Financial Reports',
    icon: '📈',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Reports Hub provides 13 ready-to-print financial reports across three categories. All reports show your tenant name, address, and phone in the print header.
        </p>
        <SubSection title="Financial Statements">
          <ul className="space-y-2 text-sm text-foreground/80">
            <li><strong>Trial Balance</strong> — verifies GL balance (debits = credits)</li>
            <li><strong>Income Statement</strong> — Revenue, COGS, Gross Profit, Operating Expenses, Net Profit for any period</li>
            <li><strong>Balance Sheet</strong> — Assets, Liabilities, and Equity at a point in time</li>
            <li><strong>VAT Summary</strong> — Output VAT vs Input VAT, net payable to FIRS; with AI-generated narrative for filing</li>
          </ul>
        </SubSection>
        <SubSection title="Operational Reports">
          <ul className="space-y-2 text-sm text-foreground/80">
            <li><strong>Sales Book Report</strong> — all sales entries with DR/CR columns by date range</li>
            <li><strong>Purchase Book Report</strong> — all purchase entries with DR/CR columns</li>
            <li><strong>Cash Book Report</strong> — cash movements with running balance</li>
            <li><strong>Bank Book Report</strong> — bank movements per account with running balance</li>
            <li><strong>Expense Report</strong> — expenses by category and date range</li>
            <li><strong>Fixed Assets Register</strong> — full asset list with Acquisition Cost, Accumulated Depreciation, Salvage Value, Net Book Value, Monthly Dep., Method</li>
            <li><strong>Inventory Report</strong> — stock on hand with cost and selling value, low-stock alerts</li>
            <li><strong>Budget vs Actuals</strong> — budget vs YTD performance with variance</li>
            <li><strong>Bank Reconciliation</strong> — reconciliation status and matched transactions</li>
          </ul>
        </SubSection>
        <SubSection title="How to Print / Save as PDF">
          <div className="space-y-2">
            <Step n={1}>Open the report from <strong>Finance → Reports</strong> or from the sidebar.</Step>
            <Step n={2}>Set your filters (date range, status, etc.) and click Generate / Refresh.</Step>
            <Step n={3}>Click the <strong>Print</strong> button (top right).</Step>
            <Step n={4}>In the browser print dialog, select <strong>Save as PDF</strong> as the destination.</Step>
          </div>
        </SubSection>
        <Note>The browser's built-in page header (showing browser title) is automatically minimised for report pages. Your company name, address, and phone appear at the top of the printed page from the report header component.</Note>
      </div>
    ),
  },
  {
    id: 'settings',
    title: '17. Finance Settings',
    icon: '⚙️',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Finance settings are accessed from <strong>Settings → Finance</strong>. They control how GL entries are posted and which accounts are used for automatic journal creation.
        </p>
        <SubSection title="GL Posting Mode">
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside">
            <li><strong>Auto Post</strong> — every transaction immediately creates a posted GL entry</li>
            <li><strong>End-of-Day (EOD)</strong> — entries are saved as drafts and batch-posted when you click "Run EOD" on the Finance Dashboard</li>
          </ul>
        </SubSection>
        <SubSection title="Transaction Journal Mappings">
          <p className="text-sm text-foreground/80">Maps system events to GL accounts. Each transaction type has a Debit (DR) and Credit (CR) account. These are pre-configured from the chart of accounts. You can override the defaults here.</p>
          <ul className="space-y-1 text-sm text-foreground/80 list-disc list-inside mt-2">
            <li><strong>Sales & Receipts</strong> — DR Receivable / CR Revenue</li>
            <li><strong>Expenses</strong> — DR Expense account / CR Cash or Bank</li>
            <li><strong>Fixed Asset Acquisition</strong> — DR Fixed Asset / CR Cash or Bank</li>
            <li><strong>Asset Depreciation</strong> — DR Depreciation Expense / CR Accum. Depreciation</li>
            <li><strong>Asset Disposal</strong> — DR Accum. Depreciation / CR Fixed Asset account</li>
          </ul>
        </SubSection>
        <SubSection title="Fixed Asset Category GL Accounts">
          <p className="text-sm text-foreground/80">Override the default GL account for each asset category. Set a specific DR (asset account) and CR (payment account) per category if your chart of accounts separates asset types by code.</p>
        </SubSection>
        <Tip>If you are not sure which GL Posting Mode to use: choose <strong>Auto Post</strong> for simplicity. Choose <strong>EOD</strong> if you want to review all journals before they hit the books each day.</Tip>
      </div>
    ),
  },
];

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
          <Printer className="w-4 h-4 mr-2" />Print Guide
        </Button>
      </div>

      {/* Intro */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-base mb-2">About This Guide</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This guide covers every feature in the Shopysh Finance Module — from recording your first journal entry to generating board-ready financial statements.
          Click any section below to expand it. Use the <strong>Print</strong> button to save a copy for reference.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          {[
            ['17', 'Sections Covered'],
            ['13', 'Report Types'],
            ['15+', 'Entry Types'],
            ['5', 'AI-Powered Features'],
          ].map(([n, l]) => (
            <div key={l} className="bg-muted/40 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{n}</p>
              <p className="text-muted-foreground mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Contents</h2>
        <div className="grid sm:grid-cols-2 gap-1">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm text-primary hover:underline flex items-center gap-2 py-0.5"
              onClick={e => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>{s.icon}</span>{s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map(s => <AccordionSection key={s.id} section={s} />)}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Shopysh Finance Module User Guide · Updated July 2026
      </div>
    </div>
  );
}
