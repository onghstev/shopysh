'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText, RefreshCw, Printer, ChevronLeft, ChevronRight,
  Plus, X, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

function getMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

function statusBadge(s: string) {
  if (s === 'POSTED') return 'bg-emerald-100 text-emerald-700';
  if (s === 'DRAFT')  return 'bg-slate-100 text-slate-600';
  return 'bg-muted text-muted-foreground';
}

// ── Printable Invoice panel ───────────────────────────────────────────────────
function InvoicePrintView({ entry, tenant, onClose }: { entry: any; tenant: any; onClose: () => void }) {
  const salesLine = entry.lines?.find((l: any) => l.account?.systemTag === 'SALES');
  const vatLine   = entry.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
  const arLine    = entry.lines?.find((l: any) => l.account?.systemTag === 'AR');
  const customer  = arLine?.customer;

  const subtotal  = salesLine ? Number(salesLine.credit) : Number(entry.totalCredit);
  const vatAmt    = vatLine   ? Number(vatLine.credit)   : 0;
  const total     = Number(entry.totalDebit);
  const invoiceDate = new Date(entry.entryDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        {/* Controls (non-printable) */}
        <div className="flex items-center justify-between px-6 py-4 border-b print:hidden">
          <h2 className="font-semibold text-sm text-muted-foreground">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-8 space-y-6" id="invoice-print">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(168 84% 26%)' }}>INVOICE</h1>
              <p className="text-lg font-semibold mt-0.5">{entry.reference || entry.entryNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{tenant?.businessName ?? 'Your Business'}</p>
              {tenant?.city && <p className="text-sm text-gray-500">{tenant.city}{tenant.state ? `, ${tenant.state}` : ''}</p>}
              {tenant?.phone && <p className="text-sm text-gray-500">{tenant.phone}</p>}
              {tenant?.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bill to + Meta */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Bill To</p>
              {customer ? (
                <>
                  <p className="font-semibold">{customer.name || customer.phone}</p>
                  {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                  {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                </>
              ) : (
                <p className="text-gray-500 italic">Sundry Customer</p>
              )}
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Date</span>
                <span className="font-medium">{invoiceDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice #</span>
                <span className="font-mono font-semibold" style={{ color: 'hsl(168 84% 26%)' }}>{entry.reference || entry.entryNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GL Entry</span>
                <span className="font-mono text-xs text-gray-400">{entry.entryNumber}</span>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">{entry.description?.split('—')[0]?.trim() || entry.description}</td>
                  <td className="py-3 px-4 text-right font-mono">₦{fmt(subtotal)}</td>
                </tr>
                {vatAmt > 0 && (
                  <tr className="border-b border-gray-100 bg-amber-50/40">
                    <td className="py-3 px-4 text-amber-700">VAT</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">₦{fmt(vatAmt)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-3 px-4 font-bold text-lg">Total Due</td>
                  <td className="py-3 px-4 text-right font-bold text-lg" style={{ color: 'hsl(168 84% 26%)' }}>
                    ₦{fmt(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Thank you for your business.</p>
            {vatAmt > 0 && <p className="mt-0.5">VAT amount of ₦{fmt(vatAmt)} has been included in the total above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FinanceInvoicesPage() {
  const router = useRouter();
  const [entries, setEntries]   = useState<any[]>([]);
  const [tenant, setTenant]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [printing, setPrinting] = useState<any>(null);
  const limit = 50;
  const { from: df, to: dt } = getMonthRange();
  const [from, setFrom] = useState(df);
  const [to, setTo]     = useState(dt);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, tenantRes] = await Promise.all([
        fetch(`/api/finance/sales-book?from=${from}&to=${to}&page=${page}&limit=${limit}`),
        fetch('/api/settings'),
      ]);
      const salesData  = await salesRes.json();
      const tenantData = await tenantRes.json();

      // Only show SALES_INVOICE type (On Credit)
      const invoices = (salesData.entries ?? []).filter((e: any) =>
        e.entryType === 'SALES_INVOICE' &&
        (!search || e.reference?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()))
      );

      setEntries(invoices);
      setTotal(invoices.length);
      setTenant(tenantData?.tenant ?? tenantData ?? null);
    } finally { setLoading(false); }
  }, [from, to, page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {printing && (
        <InvoicePrintView entry={printing} tenant={tenant} onClose={() => setPrinting(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            On-credit sales invoices — printable &amp; trackable
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button size="sm" onClick={() => router.push('/finance/sales-book')}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1 flex-1 min-w-48">
          <p className="text-xs text-muted-foreground font-medium">Search</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Reference or description…"
              className="h-9 rounded-xl pl-8"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Invoice Ref</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Customer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Description</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Net</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">VAT</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Total</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No invoices found for this period</p>
                    <Button size="sm" className="mt-3" onClick={() => router.push('/finance/sales-book')}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />Record a Sale on Credit
                    </Button>
                  </td>
                </tr>
              ) : (
                entries.map(e => {
                  const salesLine = e.lines?.find((l: any) => l.account?.systemTag === 'SALES');
                  const vatLine   = e.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
                  const arLine    = e.lines?.find((l: any) => l.account?.systemTag === 'AR');
                  const customer  = arLine?.customer;

                  return (
                    <tr key={e.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(e.entryDate).toLocaleDateString('en-NG')}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs font-semibold text-primary">{e.reference || e.entryNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        {customer ? (
                          <div>
                            <p className="text-sm font-medium">{customer.name || customer.phone}</p>
                            {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Sundry Customer</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-sm truncate">{e.description?.split('—')[0]?.trim() ?? e.description}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {salesLine ? `₦${fmt(Number(salesLine.credit))}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {vatLine ? <span className="text-amber-700">₦{fmt(Number(vatLine.credit))}</span> : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₦{fmt(Number(e.totalDebit))}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm" variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setPrinting(e)}
                        >
                          <Printer className="w-3 h-3" /> Print
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} invoices</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
