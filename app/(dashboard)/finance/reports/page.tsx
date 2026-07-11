'use client';

import Link from 'next/link';
import {
  BarChart3, Scale, TrendingUp, Activity, FileText, BookOpen,
  ChevronRight, Receipt, Package, Landmark, Wallet, PieChart,
  FileBarChart, CreditCard,
} from 'lucide-react';

const FINANCIAL_STATEMENTS = [
  {
    href: '/finance/reports/trial-balance',
    title: 'Trial Balance',
    description: 'All accounts with period debits, credits, and closing balances. Verifies the GL is in balance.',
    icon: Scale,
    color: 'bg-sky-50 text-sky-600',
    tags: ['GL', 'Audit'],
  },
  {
    href: '/finance/reports/income-statement',
    title: 'Income Statement (P&L)',
    description: 'Revenue, cost of sales, operating expenses, and net profit/loss for a period.',
    icon: TrendingUp,
    color: 'bg-emerald-50 text-emerald-600',
    tags: ['Profit', 'Management'],
  },
  {
    href: '/finance/reports/balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity at a point in time. Verifies the accounting equation.',
    icon: BarChart3,
    color: 'bg-violet-50 text-violet-600',
    tags: ['Position', 'Management'],
  },
  {
    href: '/finance/reports/vat-summary',
    title: 'VAT Summary',
    description: 'Output VAT collected on sales vs Input VAT paid on purchases. Net amount payable to FIRS.',
    icon: Receipt,
    color: 'bg-orange-50 text-orange-600',
    tags: ['VAT', 'Tax', 'FIRS'],
  },
];

const OPERATIONAL_REPORTS = [
  {
    href: '/finance/reports/expense-list',
    title: 'Expense Report',
    description: 'All recorded expenses for a period, grouped by category with totals. Printable.',
    icon: CreditCard,
    color: 'bg-red-50 text-red-500',
    tags: ['Expenses', 'Operational'],
  },
  {
    href: '/finance/reports/fixed-assets-register',
    title: 'Fixed Assets Register',
    description: 'Full register of all fixed assets with acquisition cost, accumulated depreciation, and book value.',
    icon: Landmark,
    color: 'bg-amber-50 text-amber-600',
    tags: ['Assets', 'Capital'],
  },
  {
    href: '/finance/reports/inventory',
    title: 'Inventory Report',
    description: 'Current stock levels, cost valuations, and low-stock alerts for all products.',
    icon: Package,
    color: 'bg-teal-50 text-teal-600',
    tags: ['Stock', 'Inventory'],
  },
  {
    href: '/finance/reports/cash-book',
    title: 'Cash Book',
    description: 'Period cash receipts and payments with opening balance, running balance, and closing balance. Printable.',
    icon: Wallet,
    color: 'bg-primary/10 text-primary',
    tags: ['Cash', 'Bank'],
  },
  {
    href: '/finance/reports/bank-reconciliation',
    title: 'Bank Reconciliation',
    description: 'Statement lines vs GL entries — matched, unmatched items, and reconciliation proof. Printable.',
    icon: FileBarChart,
    color: 'bg-indigo-50 text-indigo-600',
    tags: ['Bank', 'Reconciliation'],
  },
  {
    href: '/finance/reports/budget',
    title: 'Budget vs Actuals',
    description: 'Budgeted amounts vs year-to-date actuals with variance and % used per account. Printable.',
    icon: PieChart,
    color: 'bg-green-50 text-green-600',
    tags: ['Budget', 'Management'],
  },
];

const OTHER_REPORTS = [
  {
    href: '/finance/statements',
    title: 'Cash Flow Summary',
    description: 'Summary of cash received, cash paid, and bank positions across all accounts.',
    icon: Activity,
    color: 'bg-amber-50 text-amber-600',
    tags: ['Cash', 'Liquidity'],
  },
  {
    href: '/finance/invoices',
    title: 'Invoice Ledger',
    description: 'All customer invoices with status, ageing, and outstanding amounts.',
    icon: FileText,
    color: 'bg-red-50 text-red-500',
    tags: ['AR', 'Collections'],
  },
  {
    href: '/finance/journal',
    title: 'General Ledger',
    description: 'Full double-entry journal history. Filter by account, date, or entry type.',
    icon: BookOpen,
    color: 'bg-primary/10 text-primary',
    tags: ['GL', 'Detailed'],
  },
];

function ReportCard({ r }: { r: typeof FINANCIAL_STATEMENTS[0] }) {
  return (
    <Link key={r.href} href={r.href}
      className="group rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${r.color}`}>
          <r.icon className="w-5 h-5" />
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold text-sm">{r.title}</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{r.description}</p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {r.tags.map(t => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t}</span>
        ))}
      </div>
    </Link>
  );
}

function Section({ title, reports }: { title: string; reports: typeof FINANCIAL_STATEMENTS }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => <ReportCard key={r.href} r={r} />)}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Professional accounting statements and operational reports</p>
      </div>

      <Section title="Financial Statements" reports={FINANCIAL_STATEMENTS} />
      <Section title="Operational Reports" reports={OPERATIONAL_REPORTS} />
      <Section title="Ledgers & Registers" reports={OTHER_REPORTS} />
    </div>
  );
}
