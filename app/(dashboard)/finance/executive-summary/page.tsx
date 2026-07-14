'use client';

import { Download, ChevronLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const jade = 'hsl(168,84%,26%)';
const gold = 'hsl(40,78%,47%)';

function Divider() {
  return <div className="border-t border-border my-6 print:my-4" />;
}

function KpiBox({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center p-5 rounded-2xl border border-border bg-card shadow-sm print:border print:shadow-none">
      <p className="text-3xl font-bold" style={{ color: jade }}>{value}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function FeatureRow({ icon, title, benefit }: { icon: string; title: string; benefit: string }) {
  return (
    <div className="flex gap-4 items-start py-3 border-b border-border/50 last:border-0 print:py-2">
      <span className="text-2xl flex-shrink-0 print:text-base">{icon}</span>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{benefit}</p>
      </div>
    </div>
  );
}

function PillarCard({ icon, title, points }: { icon: string; title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm print:border print:shadow-none print:p-3">
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

export default function FinanceExecutiveSummaryPage() {
  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Finance</Button>
          </Link>
          <h1 className="text-xl font-bold">Executive Summary</h1>
        </div>
        <div className="flex gap-2">
          <a href="/downloads/finance-executive-summary.pdf" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />Download PDF
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print / Save PDF
          </Button>
        </div>
      </div>

      {/* ── PAGE CONTENT (prints as-is) ── */}
      <div className="bg-white rounded-3xl border border-border shadow-md overflow-hidden print:shadow-none print:border-0 print:rounded-none">

        {/* Cover banner */}
        <div className="px-10 py-10 print:px-8 print:py-8" style={{ background: `linear-gradient(135deg, ${jade} 0%, hsl(168,70%,18%) 100%)` }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: gold, opacity: 0.9 }}>Shopysh · Finance Module</p>
              <h1 className="text-3xl font-bold text-white leading-tight print:text-2xl">
                Intelligent Financial Management<br />for Growing African Businesses
              </h1>
              <p className="mt-3 text-sm text-white/80 max-w-xl leading-relaxed">
                A complete, double-entry accounting and financial intelligence platform —
                purpose-built for Nigerian and Pan-African SMEs seeking compliance,
                clarity, and competitive advantage.
              </p>
            </div>
            <div className="hidden md:block print:hidden">
              <div className="text-6xl opacity-20">📊</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {['IFRS-Aligned', 'FIRS VAT Compliant', 'AI-Powered', 'Multi-Currency', 'Real-Time Insights'].map(t => (
              <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full border border-white/30 text-white/90">{t}</span>
            ))}
          </div>
        </div>

        <div className="px-10 py-8 space-y-8 print:px-8 print:py-6 print:space-y-6">

          {/* Executive Overview */}
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

          {/* KPI Strip */}
          <section>
            <h2 className="text-lg font-bold mb-4">Module at a Glance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
              <KpiBox value="17+" label="Finance Features" sub="End-to-end coverage" />
              <KpiBox value="13" label="Report Types" sub="Printable & PDF-ready" />
              <KpiBox value="5" label="AI Capabilities" sub="Forecasting, matching & more" />
              <KpiBox value="3" label="Chart Templates" sub="Nigerian Standard, Simple, Retail" />
            </div>
          </section>

          <Divider />

          {/* Strategic Value Pillars */}
          <section>
            <h2 className="text-lg font-bold mb-4">Strategic Value Pillars</h2>
            <div className="grid sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              <PillarCard
                icon="🎯"
                title="Financial Accuracy & Compliance"
                points={[
                  'Double-entry GL ensures books never go out of balance',
                  'FIRS-ready VAT Summary with AI-generated filing narrative',
                  'Full audit trail — every entry is timestamped and attributed',
                  'IFRS-aligned chart of accounts templates',
                ]}
              />
              <PillarCard
                icon="⚡"
                title="Operational Efficiency"
                points={[
                  'Auto-posting: storefront sales hit the GL without manual entry',
                  'Recurring Journals eliminate repetitive data entry',
                  'CSV import for bulk journal uploads',
                  'End-of-Day batch posting for controlled close processes',
                ]}
              />
              <PillarCard
                icon="🔭"
                title="Forward-Looking Intelligence"
                points={[
                  'AI Cash Flow Forecast — 30, 60, or 90 day projections',
                  'Proactive alerts for negative cash balance scenarios',
                  'Budget vs Actuals with AI variance explanations',
                  'Overdue AR alerts surfaced daily on the dashboard',
                ]}
              />
              <PillarCard
                icon="🏦"
                title="Bank & Asset Control"
                points={[
                  'AI-assisted Bank Reconciliation — auto-match transactions',
                  'Full Fixed Asset Register with depreciation automation',
                  'Multiple depreciation methods: Straight-Line, Reducing Balance',
                  'Disposal workflow with complete GL treatment',
                ]}
              />
            </div>
          </section>

          <Divider />

          {/* Feature Benefits Table */}
          <section>
            <h2 className="text-lg font-bold mb-4">Feature-by-Feature Business Benefits</h2>
            <div className="rounded-2xl border border-border overflow-hidden print:border">
              <FeatureRow
                icon="📊"
                title="Real-Time Finance Dashboard"
                benefit="Owners and finance managers see Revenue, Expenses, Net Profit, Cash, AR, AP, and Fixed Asset values on a single screen — updated live as transactions are recorded. No month-end wait for financial visibility."
              />
              <FeatureRow
                icon="📋"
                title="Chart of Accounts with Templates"
                benefit="Businesses are operational in minutes using pre-built account structures (Nigerian Standard, Simple Business, or Retail/Trading). Reduces the need for an accountant to set up the system from scratch."
              />
              <FeatureRow
                icon="📝"
                title="Journal Entry Engine (15 Types)"
                benefit="Captures every transaction type — sales, purchases, cash, bank, expenses, adjustments — in one system. CSV import handles high-volume entry. Draft workflow ensures entries are reviewed before posting."
              />
              <FeatureRow
                icon="🧾"
                title="Sales Book with Printable Invoices"
                benefit="Issue professional credit invoices and receipts directly from the system. Reduces collection time by providing customers with formal documentation. Feeds AR aging automatically."
              />
              <FeatureRow
                icon="📥"
                title="Accounts Receivable Aging"
                benefit="Know exactly who owes money and for how long. Four aging buckets (Current, 31–60, 61–90, 90+ days) make it easy to prioritise collections and protect cash flow."
              />
              <FeatureRow
                icon="📤"
                title="Accounts Payable Aging"
                benefit="Stay ahead of supplier obligations. Track what is owed, to whom, and when — avoiding late payment penalties and protecting supplier relationships."
              />
              <FeatureRow
                icon="💳"
                title="Expense Management"
                benefit="Categorised expense tracking with visual breakdown by category. Supports all payment methods including Mobile Money. CSV export for tax preparation. Reduces cost blind spots."
              />
              <FeatureRow
                icon="🏗️"
                title="Fixed Asset Register & Depreciation"
                benefit="Automates one of the most error-prone areas of SME accounting. Tracks acquisition cost, accumulated depreciation, salvage value, and net book value per asset. Batch depreciation saves hours each month."
              />
              <FeatureRow
                icon="🎯"
                title="Budget vs Actuals Tracking"
                benefit="Set financial targets and track performance against them in real time. AI-generated variance explanations help management understand what is driving over- or under-spend without requiring a finance degree."
              />
              <FeatureRow
                icon="🔗"
                title="AI-Powered Bank Reconciliation"
                benefit="Reduces reconciliation time from hours to minutes. The AI auto-matches bank statement transactions to GL entries based on amount, date, and description — the controller just reviews and confirms."
              />
              <FeatureRow
                icon="🔭"
                title="AI Cash Flow Forecast"
                benefit="Predicts future cash balances up to 90 days ahead, incorporating recurring journals, historical patterns, and seasonal trends. Enables proactive cash management rather than reactive crisis response."
              />
              <FeatureRow
                icon="📈"
                title="13 Printable Financial Reports"
                benefit="Trial Balance, Income Statement, Balance Sheet, VAT Summary, Sales Book, Purchase Book, Cash Book, Bank Book, Expense Report, Fixed Assets Register, Inventory, Budget vs Actuals, and Bank Reconciliation — all print-ready with company header, suitable for banks, auditors, and board meetings."
              />
              <FeatureRow
                icon="🔄"
                title="Recurring Journals"
                benefit="Automates repetitive entries (rent, loan repayments, salaries) — eliminating manual monthly effort and reducing the risk of missed entries that distort financial statements."
              />
              <FeatureRow
                icon="🏦"
                title="Multi-Bank Account Support"
                benefit="Manage multiple bank accounts in one place. Bank Book report shows per-account movements and running balances — critical for businesses operating across multiple banks or mobile wallets."
              />
            </div>
          </section>

          <Divider />

          {/* Compliance section */}
          <section>
            <h2 className="text-lg font-bold mb-3">Regulatory & Tax Compliance</h2>
            <div className="grid sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
              {[
                {
                  title: 'VAT / FIRS Compliance',
                  body: 'Automatically tracks Output VAT on sales and Input VAT on purchases. The VAT Summary report calculates net payable to FIRS for each period. The AI generates a professional FIRS return narrative ready for submission.',
                },
                {
                  title: 'Audit-Ready Records',
                  body: 'Every transaction has a full audit trail — user, timestamp, entry number, and linked journal lines. The Trial Balance and General Ledger can be exported at any time for external auditors.',
                },
                {
                  title: 'IFRS-Aligned Accounts',
                  body: 'The Nigerian Standard chart template follows IFRS account classification (Assets, Liabilities, Equity, Income, Expense). Financial statements produced are immediately recognisable to banks and auditors.',
                },
              ].map(c => (
                <div key={c.title} className="rounded-xl border border-border p-4 print:border print:p-3">
                  <p className="font-semibold text-sm mb-1.5">{c.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ROI Summary */}
          <section>
            <h2 className="text-lg font-bold mb-3">Return on Investment</h2>
            <div className="grid sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {[
                { label: 'Time Saved on Reconciliation', value: 'Up to 80%', detail: 'AI auto-matching eliminates manual line-by-line comparison' },
                { label: 'Faster Month-End Close', value: '3× faster', detail: 'Recurring journals and auto-posting remove repetitive manual steps' },
                { label: 'Reduction in Overdue Receivables', value: 'Significant', detail: 'Daily AR alerts and aging buckets drive faster collections' },
                { label: 'Financial Reporting Readiness', value: 'Instant', detail: '13 reports available on demand — no accountant wait time for board packs' },
              ].map(r => (
                <div key={r.label} className="flex gap-3 items-start p-4 rounded-xl border border-border print:border print:p-3">
                  <span className="text-2xl font-bold flex-shrink-0 print:text-lg" style={{ color: jade }}>{r.value}</span>
                  <div>
                    <p className="font-semibold text-sm">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* Closing */}
          <section className="text-center">
            <p className="text-sm font-semibold" style={{ color: jade }}>Shopysh Finance Module</p>
            <p className="text-xs text-muted-foreground mt-1">
              Purpose-built for African SMEs · Double-Entry GL · AI-Powered · FIRS Compliant
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Executive Summary · July 2026
            </p>
          </section>

        </div>
      </div>

      {/* Print CSS */}
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
