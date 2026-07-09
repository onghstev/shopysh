'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Download, RefreshCw, ChevronLeft, ChevronRight, BookOpen, Plus, X,
  Hash, Percent, DollarSign, Loader2, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CustomerLookup from '@/components/finance/CustomerLookup';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function getTypeLabel(t: string) {
  if (t === 'SALES_INVOICE') return 'Invoice';
  if (t === 'SALES_RECEIPT') return 'Receipt';
  if (t === 'CREDIT_NOTE') return 'Credit Note';
  return t;
}

function getTypeBadge(t: string) {
  if (t === 'SALES_INVOICE') return 'bg-emerald-100 text-emerald-700';
  if (t === 'SALES_RECEIPT') return 'bg-sky-100 text-sky-700';
  if (t === 'CREDIT_NOTE') return 'bg-amber-100 text-amber-700';
  return 'bg-muted text-muted-foreground';
}

// ── Reference generator ───────────────────────────────────────────────────────
function RefInput({ value, onChange, paymentMethod }: {
  value: string; onChange: (v: string) => void; paymentMethod: string;
}) {
  const [loading, setLoading] = useState(false);
  const prefix = paymentMethod === 'INVOICE' ? 'INV' : paymentMethod === 'CASH' ? 'RCT' : 'RCT';

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/finance/next-reference?type=${prefix}`);
      const data = await res.json();
      if (data.reference) onChange(data.reference);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [prefix, onChange]);

  // Auto-generate when modal first renders or payment method changes
  useEffect(() => { if (!value) generate(); }, [prefix]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. INV-2026-0001"
        className="h-9 rounded-xl pr-9"
      />
      <button
        type="button"
        onClick={generate}
        title="Generate next reference"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── VAT input with % / ₦ toggle ───────────────────────────────────────────────
function VATInput({ amount, vatAmount, onVatChange }: {
  amount: string; vatAmount: string; onVatChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<'amount' | 'percent'>('amount');
  const [pct, setPct] = useState('');

  const base = parseFloat(amount) || 0;

  const handlePctChange = (v: string) => {
    setPct(v);
    const p = parseFloat(v) || 0;
    onVatChange((base * p / 100).toFixed(2));
  };

  // Recalculate when base amount changes and mode is %
  useEffect(() => {
    if (mode === 'percent' && pct) {
      const p = parseFloat(pct) || 0;
      onVatChange((base * p / 100).toFixed(2));
    }
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">VAT</Label>
        <div className="flex rounded-lg border border-input overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode('amount')}
            className={`px-2 py-0.5 flex items-center gap-0.5 transition-colors ${mode === 'amount' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <span className="font-bold text-[10px]">₦</span> Amount
          </button>
          <button
            type="button"
            onClick={() => setMode('percent')}
            className={`px-2 py-0.5 flex items-center gap-0.5 transition-colors ${mode === 'percent' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <Percent className="w-2.5 h-2.5" /> Rate
          </button>
        </div>
      </div>

      {mode === 'amount' ? (
        <Input
          type="number" min="0" step="0.01"
          value={vatAmount}
          onChange={e => onVatChange(e.target.value)}
          placeholder="0.00"
          className="h-9 rounded-xl"
        />
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <Input
              type="number" min="0" max="100" step="0.5"
              value={pct}
              onChange={e => handlePctChange(e.target.value)}
              placeholder="e.g. 7.5"
              className="h-9 rounded-xl pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          {pct && base > 0 && (
            <p className="text-[11px] text-muted-foreground pl-1">
              {pct}% × ₦{fmt(base)} = <span className="font-semibold text-foreground">₦{fmt(parseFloat(vatAmount) || 0)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Record Sale modal ─────────────────────────────────────────────────────────
function RecordSaleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    reference: '',
    description: '',
    amount: '',
    vatAmount: '0',
    paymentMethod: 'INVOICE',
  });
  const [customerId, setCustomerId]     = useState('');
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving]             = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.date || !form.description || !form.amount || !form.paymentMethod) {
      toast.error('Date, description, amount, and payment method are required');
      return;
    }
    if (!form.reference) {
      toast.error('Invoice reference is required — click the refresh icon to generate one');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/sales-book/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount:      parseFloat(form.amount),
          vatAmount:   parseFloat(form.vatAmount) || 0,
          customerId:  customerId  || undefined,
          customerName: customerName || 'Sundry Customer',
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Sale recorded successfully');
      onSaved();
    } finally { setSaving(false); }
  };

  const subtotal = parseFloat(form.amount) || 0;
  const vatAmt   = parseFloat(form.vatAmount) || 0;
  const total    = subtotal + vatAmt;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg my-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Record Sale</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="h-9 rounded-xl" />
          </div>

          {/* Reference - auto-generated, editable */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Hash className="w-3 h-3" /> Reference *
            </Label>
            <RefInput
              value={form.reference}
              onChange={v => set('reference', v)}
              paymentMethod={form.paymentMethod}
            />
          </div>

          {/* Customer */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Customer</Label>
            <CustomerLookup
              value={customerId}
              displayName={customerName}
              onChange={(id, name) => { setCustomerId(id); setCustomerName(name); }}
              onClear={() => { setCustomerId(''); setCustomerName(''); }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Description *</Label>
            <Input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Sale of goods"
              className="h-9 rounded-xl"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (excl. VAT) *</Label>
            <Input
              type="number" value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00" min="0"
              className="h-9 rounded-xl"
            />
          </div>

          {/* VAT with toggle */}
          <VATInput
            amount={form.amount}
            vatAmount={form.vatAmount}
            onVatChange={v => set('vatAmount', v)}
          />

          {/* Payment Method */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Payment Method *</Label>
            <div className="flex gap-2">
              {[
                { value: 'INVOICE', label: 'On Credit (AR)' },
                { value: 'CASH',    label: 'Cash'           },
                { value: 'BANK',    label: 'Bank Transfer'  },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { set('paymentMethod', opt.value); set('reference', ''); }}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    form.paymentMethod === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Totals summary */}
        {subtotal > 0 && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Net Amount</span><span>₦{fmt(subtotal)}</span>
            </div>
            {vatAmt > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (→ VAT Output GL)</span>
                  <span className="text-amber-700 font-medium">₦{fmt(vatAmt)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  VAT is posted separately to your VAT Output account (not mixed with sales revenue)
                </div>
              </>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-border">
              <span>Total {form.paymentMethod === 'INVOICE' ? 'AR Debit' : 'Cash/Bank Debit'}</span>
              <span>₦{fmt(total)}</span>
            </div>
            {vatAmt > 0 && (
              <div className="text-[11px] text-muted-foreground pt-0.5">
                GL split: ₦{fmt(subtotal)} → Sales Revenue · ₦{fmt(vatAmt)} → VAT Output
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Record Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SalesBookPage() {
  const [entries, setEntries]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [totals, setTotals]       = useState({ totalDebit: 0, totalCredit: 0 });
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [showRecord, setShowRecord] = useState(false);
  const limit = 50;
  const { from: defaultFrom, to: defaultTo } = getMonthRange();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo]     = useState(defaultTo);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/sales-book?from=${from}&to=${to}&page=${page}&limit=${limit}`);
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
      setTotals(data.totals ?? { totalDebit: 0, totalCredit: 0 });
    } finally { setLoading(false); }
  }, [from, to, page]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Entry #', 'Ref', 'Type', 'Description', 'Customer', 'Net Sales', 'VAT', 'Total DR', 'Status'],
      ...entries.map(e => {
        const salesLine = e.lines?.find((l: any) => l.account?.systemTag === 'SALES');
        const vatLine   = e.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
        return [
          new Date(e.entryDate).toLocaleDateString('en-NG'),
          e.entryNumber,
          e.reference ?? '',
          getTypeLabel(e.entryType),
          e.description ?? '',
          '',
          salesLine ? Number(salesLine.credit).toFixed(2) : '',
          vatLine   ? Number(vatLine.credit).toFixed(2)   : '',
          Number(e.totalDebit).toFixed(2),
          e.status,
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a   = document.createElement('a'); a.href = url; a.download = `sales-book-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {showRecord && (
        <RecordSaleModal onClose={() => setShowRecord(false)} onSaved={() => { setShowRecord(false); load(); }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Sales Book
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Posted sales invoices, receipts &amp; credit notes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>
          <Button size="sm" onClick={() => setShowRecord(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Record Sale</Button>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-9 rounded-xl w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total AR / Cash Debit</p>
          <p className="text-xl font-bold" style={{ color: 'hsl(168 84% 26%)' }}>₦{fmt(totals.totalDebit)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Net Sales Revenue</p>
          <p className="text-xl font-bold" style={{ color: 'hsl(40 78% 47%)' }}>₦{fmt(totals.totalCredit)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Entries</p>
          <p className="text-xl font-bold">{total}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Ref / Entry</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Description</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Net Sales</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">VAT</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Total DR</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
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
                    <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No entries found for this period</p>
                  </td>
                </tr>
              ) : (
                entries.map(e => {
                  const salesLine = e.lines?.find((l: any) => l.account?.systemTag === 'SALES' && Number(l.credit) > 0);
                  const vatLine   = e.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT' && Number(l.credit) > 0);

                  return (
                    <tr key={e.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(e.entryDate).toLocaleDateString('en-NG')}
                      </td>
                      <td className="py-3 px-4">
                        {e.reference && <p className="font-mono text-xs font-semibold text-primary">{e.reference}</p>}
                        <p className="text-[11px] text-muted-foreground font-mono">{e.entryNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getTypeBadge(e.entryType)}`}>
                          {getTypeLabel(e.entryType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-sm truncate">{e.description}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {salesLine ? `₦${fmt(Number(salesLine.credit))}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        {vatLine ? (
                          <span className="text-amber-700">₦{fmt(Number(vatLine.credit))}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-sm">
                        ₦{fmt(Number(e.totalDebit))}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {e.status}
                        </span>
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
          <span>Page {page} of {totalPages} · {total} entries</span>
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
