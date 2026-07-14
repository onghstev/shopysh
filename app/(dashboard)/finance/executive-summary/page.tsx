'use client';

import { useState } from 'react';
import { Download, ChevronLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardMockup, ChartOfAccountsMockup, JournalEntriesMockup,
  SalesBookMockup, PurchaseBookMockup, CashBookMockup, BankBookMockup,
  VendorsMockup, DebtorsMockup, CreditorsMockup, ExpensesMockup,
  FixedAssetsMockup, BankReconciliationMockup, BudgetMockup, RecurringJournalsMockup,
} from '@/components/finance/screen-mockups';

const JADE = 'hsl(168,84%,26%)';
const GOLD = 'hsl(40,78%,47%)';

function Divider() { return <div className="border-t border-border my-6 print:my-4" />; }

function Kpi({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center p-5 rounded-2xl border border-border bg-card shadow-sm">
      <p className="text-3xl font-bold" style={{ color: JADE }}>{value}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function FeatureRow({ icon, title, benefit }: { icon: string; title: string; benefit: string }) {
  return (
    <div className="flex gap-4 items-start py-3 border-b border-border/50 last:border-0">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{benefit}</p>
      </div>
    </div>
  );
}

function PillarCard({ icon, title, points }: { icon: string; title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
            <span className="text-primary font-bold flex-shrink-0 mt-0.5">✓</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SCREENS = [
  { key: 'dashboard',  label: 'Finance Dashboard',      icon: '📊', component: <DashboardMockup /> },
  { key: 'accounts',   label: 'Chart of Accounts',      icon: '📋', component: <ChartOfAccountsMockup /> },
  { key: 'journal',    label: 'Journal Entries',         icon: '📝', component: <JournalEntriesMockup /> },
  { key: 'sales',      label: 'Sales Book',             icon: '🧾', component: <SalesBookMockup /> },
  { key: 'purchase',   label: 'Purchase Book',          icon: '🛒', component: <PurchaseBookMockup /> },
  { key: 'cashbook',   label: 'Cash Book',              icon: '💵', component: <CashBookMockup /> },
  { key: 'bankbook',   label: 'Bank Book',              icon: '🏦', component: <BankBookMockup /> },
  { key: 'vendors',    label: 'Vendors',                icon: '🏢', component: <VendorsMockup /> },
  { key: 'debtors',    label: 'Debtors / AR',           icon: '📥', component: <DebtorsMockup /> },
  { key: 'creditors',  label: 'Creditors / AP',         icon: '📤', component: <CreditorsMockup /> },
  { key: 'expenses',   label: 'Expenses',               icon: '💳', component: <ExpensesMockup /> },
  { key: 'assets',     label: 'Fixed Assets',           icon: '🏗️', component: <FixedAssetsMockup /> },
  { key: 'recon',      label: 'Bank Reconciliation',    icon: '🔗', component: <BankReconciliationMockup /> },
  { key: 'budget',     label: 'Budget vs Actuals',      icon: '🎯', component: <BudgetMockup /> },
  { key: 'recurring',  label: 'Recurring Journals',     icon: '🔄', component: <RecurringJournalsMockup /> },
];

function ScreenGallery() {
  const [active, setActive] = useState('dashboard');
  const current = SCREENS.find(s => s.key === active)!;
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm print:hidden">
      {/* Tab bar — scrollable on small screens */}
      <div className="overflow-x-auto bg-muted/20 border-b border-border">
        <div className="flex min-w-max">
          {SCREENS.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                s.key === active
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {/* Active screen */}
      <div className="bg-[#f0f0f0] p-4">
        <div className="max-w-3xl mx-auto">
          {current.component}
        </div>
      </div>
    </div>
  );
}

export default function FinanceExecutiveSummaryPage() {
  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Finance</Button>
          </Link>
          <h1 className="text-xl font-bold">Executive Summary</h1>
        </div>
        <div className="flex gap-2">
          <a href="/downloads/finance-executive-summary.pdf" download>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-md overflow-hidden print:shadow-none print:border-0 print:rounded-none">

        {/* Cover banner */}
        <div className="px-10 py-10 print:px-8 print:py-8" style={{ background: `linear-gradient(135deg, ${JADE} 0%, hsl(168,70%,18%) 100%)` }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: GOLD, opacity: 0.9 }}>Shopysh · Finance Module</p>
          <h1 className="text-3xl font-bold text-white leading-tight print:text-2xl">
            Intelligent Financial Management<br />for Growing African Businesses
          </h1>
          <p className="mt-3 text-sm text-white/80 max-w-xl leading-relaxed">
            A complete, double-entry accounting and financial intelligence platform —
            purpose-built for Nigerian and Pan-African SMEs seeking compliance,
            clarity, and competitive advantage.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {['IFRS-Aligned', 'FIRS VAT Compliant', 'AI-Powered', 'Multi-Currency', 'Real-Time Insights'].map(t => (
              <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full border border-white/30 text-white/90">{t}</span>
            ))}
          </div>
        </div>

        <div className="px-10 py-8 space-y-8 print:px-8 print:py-6 print:space-y-6">

          {/* Overview */}
          <section>
            <h2 className="text-lg font-bold mb-1">Executive Overview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Shopysh Finance Module transforms how SMEs manage money. Rather than spreadsheets and disconnected tools,
              it provides a unified, real-time accounting engine that automatically captures every transaction — from storefront
              sales to supplier payments — and presents decision-ready insights to owners and management teams.
              Built on internationally accepted double-entry bookkeeping principles, it is compliant with Nigerian tax law (VAT / FIRS)
              and designed to grow with the business from sole trader to multi-location enterprise.
            </p>
          </section>

          <Divider />

          {/* KPI strip */}
          <section>
            <h2 className="text-lg font-bold mb-4">Module at a Glance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Kpi value="15+" label="Finance Screens" sub="End-to-end coverage" />
              <Kpi value="13" label="Report Types" sub="Printable & PDF-ready" />
              <Kpi value="5" label="AI Capabilities" sub="Forecast, match & explain" />
              <Kpi value="3" label="Chart Templates" sub="Nigerian Standard, Simple, Retail" />
            </div>
          </section>

          <Divider />

          {/* Interactive screen gallery */}
          <section>
            <h2 className="text-lg font-bold mb-1">Product Interface</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Click any tab below to preview each Finance module screen with live sample data.
            </p>
            <ScreenGallery />
          </section>

          <Divider />

          {/* Strategic pillars */}
          <section>
            <h2 className="text-lg font-bold mb-4">Strategic Value Pillars</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <PillarCard icon="🎯" title="Financial Accuracy & Compliance" points={[
                'Double-entry GL ensures books never go out of balance',
                'FIRS-ready VAT Summary with AI-generated filing narrative',
                'Full audit trail — every entry timestamped and attributed',
                'IFRS-aligned chart of accounts templates',
              ]} />
              <PillarCard icon="⚡" title="Operational Efficiency" points={[
                'Auto-posting: storefront sales hit the GL without manual entry',
                'Recurring Journals eliminate repetitive data entry',
                'CSV import for bulk journal uploads',
                'End-of-Day batch posting for controlled close processes',
              ]} />
              <PillarCard icon="🔭" title="Forward-Looking Intelligence" points={[
                'AI Cash Flow Forecast — 30, 60, or 90-day projections',
                'Proactive alerts for negative cash balance scenarios',
                'Budget vs Actuals with AI variance explanations',
                'Overdue AR alerts surfaced daily on the dashboard',
              ]} />
              <PillarCard icon="🏦" title="Bank & Asset Control" points={[
                'AI-assisted Bank Reconciliation — auto-match transactions',
                'Full Fixed Asset Register with depreciation automation',
                'Multiple depreciation methods: Straight-Line, Reducing Balance',
                'Disposal workflow with complete GL treatment',
              ]} />
            </div>
          </section>

          <Divider />

          {/* Feature benefits */}
          <section>
            <h2 className="text-lg font-bold mb-4">Feature-by-Feature Business Benefits</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <FeatureRow icon="📊" title="Real-Time Finance Dashboard"
                benefit="Revenue, Expenses, Net Profit, Cash, AR, AP, and Fixed Asset values on a single screen — updated live. No month-end wait for financial visibility." />
              <FeatureRow icon="📋" title="Chart of Accounts with Templates"
                benefit="Businesses are operational in minutes using pre-built account structures. Reduces the need for an accountant to set up the system from scratch." />
              <FeatureRow icon="📝" title="Journal Entry Engine (15 Types)"
                benefit="Captures every transaction type in one system. CSV import handles high-volume entry. Draft workflow ensures review before posting." />
              <FeatureRow icon="🧾" title="Sales Book with Printable Invoices"
                benefit="Issue professional credit invoices and receipts directly from the system. Feeds AR aging automatically and reduces collection time." />
              <FeatureRow icon="🛒" title="Purchase Book & Vendor Management"
                benefit="Track supplier bills, payments, and debit notes. Vendor master records link outstanding balances and tax IDs for compliance." />
              <FeatureRow icon="💵" title="Cash Book & Bank Book"
                benefit="Per-account running-balance ledgers with opening and closing balance rows — ready for printing or sharing with auditors." />
              <FeatureRow icon="📥" title="Accounts Receivable Aging"
                benefit="Four aging buckets (Current, 31–60, 61–90, 90+ days) make it easy to prioritise collections and protect cash flow." />
              <FeatureRow icon="📤" title="Accounts Payable Aging"
                benefit="Track what is owed to suppliers and when — avoiding late payment penalties and protecting vendor relationships." />
              <FeatureRow icon="💳" title="Expense Management"
                benefit="Categorised expense tracking with visual breakdown by category. Supports all payment methods including Mobile Money. CSV export for tax prep." />
              <FeatureRow icon="🏗️" title="Fixed Asset Register & Depreciation"
                benefit="Automates acquisition cost, accumulated depreciation, salvage value, and net book value. Batch depreciation saves hours each month." />
              <FeatureRow icon="🎯" title="Budget vs Actuals Tracking"
                benefit="Set financial targets and track performance in real time. AI-generated variance explanations help management understand over- or under-spend." />
              <FeatureRow icon="🔗" title="AI-Powered Bank Reconciliation"
                benefit="Reduces reconciliation time from hours to minutes. Auto-matches transactions by amount, date, and description — controller just reviews." />
              <FeatureRow icon="🔄" title="Recurring Journals"
                benefit="Automates rent, loans, salaries, and other repetitive entries — eliminating manual monthly effort and missed entries." />
              <FeatureRow icon="📈" title="13 Printable Financial Reports"
                benefit="Trial Balance, Income Statement, Balance Sheet, VAT Summary, Sales Book, Purchase Book, Cash Book, Bank Book, Expense, Fixed Assets, Inventory, Budget, Bank Reconciliation — all print-ready with company header." />
            </div>
          </section>

          <Divider />

          {/* Compliance */}
          <section>
            <h2 className="text-lg font-bold mb-3">Regulatory & Tax Compliance</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'VAT / FIRS Compliance', body: 'Automatically tracks Output VAT on sales and Input VAT on purchases. VAT Summary calculates net payable to FIRS. AI generates a professional filing narrative ready for submission.' },
                { title: 'Audit-Ready Records', body: 'Every transaction has a full audit trail — user, timestamp, entry number, and linked journal lines. Trial Balance and GL can be exported at any time for external auditors.' },
                { title: 'IFRS-Aligned Accounts', body: 'The Nigerian Standard chart template follows IFRS classification. Financial statements produced are immediately recognisable to banks, investors, and auditors.' },
              ].map(c => (
                <div key={c.title} className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-sm mb-1.5">{c.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ROI */}
          <section>
            <h2 className="text-lg font-bold mb-3">Return on Investment</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { value: 'Up to 80%', label: 'Time Saved on Reconciliation', detail: 'AI auto-matching eliminates manual line-by-line bank statement comparison' },
                { value: '3× Faster', label: 'Month-End Close', detail: 'Recurring journals and auto-posting remove repetitive manual steps' },
                { value: 'Significant', label: 'Reduction in Overdue Receivables', detail: 'Daily AR alerts and aging buckets drive faster collections' },
                { value: 'Instant', label: 'Financial Reporting Readiness', detail: '13 reports on demand — no wait time for board packs or audit prep' },
              ].map(r => (
                <div key={r.label} className="flex gap-3 items-start p-4 rounded-xl border border-border">
                  <span className="text-2xl font-bold flex-shrink-0" style={{ color: JADE }}>{r.value}</span>
                  <div>
                    <p className="font-semibold text-sm">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          <section className="text-center">
            <p className="text-sm font-semibold" style={{ color: JADE }}>Shopysh Finance Module</p>
            <p className="text-xs text-muted-foreground mt-1">
              Purpose-built for African SMEs · Double-Entry GL · AI-Powered · FIRS Compliant
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Executive Summary · July 2026</p>
          </section>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; size: A4 portrait; }
        }
      `}</style>
    </div>
  );
}
