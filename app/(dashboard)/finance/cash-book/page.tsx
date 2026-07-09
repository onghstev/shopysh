'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Banknote, Plus, X, ReceiptText } from 'lucide-react';
import { printReceipt } from '@/lib/print-receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CustomerLookup from '@/components/finance/CustomerLookup';
import VendorLookup from '@/components/finance/VendorLookup';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function RecordCashModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: 'RECEIPT' as 'RECEIPT' | 'PAYMENT',
    date: today,
    description: '',
    amount: '',
    contraAccountId: '',
  });
  const [customerId, setCustomerId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/finance/accounts')
      .then(r => r.json())
      .then(d => setAccounts((d.accounts ?? []).filter((a: any) => a.allowPosting)))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.date || !form.description || !form.amount || !form.contraAccountId) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/cash-book/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          description: form.description,
          amount: parseFloat(form.amount),
          contraAccountId: form.contraAccountId,
          customerId: form.type === 'RECEIPT' && customerId ? customerId : undefined,
          vendorId: form.type === 'PAYMENT' && vendorId ? vendorId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Cash ${form.type === 'RECEIPT' ? 'receipt' : 'payment'} recorded`);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md my-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Record Cash Transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Transaction Type *</Label>
          <div className="flex gap-2">
            {(['RECEIPT', 'PAYMENT'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setForm(p => ({ ...p, type: t })); setCustomerId(''); setVendorId(''); }}
                className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  form.type === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-muted'
                }`}
              >
                {t === 'RECEIPT' ? 'Receipt (money in)' : 'Payment (money out)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount *</Label>
            <Input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Description *</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Cash sales collection" className="h-9 rounded-xl" />
          </div>
          {form.type === 'RECEIPT' && (
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Link to Customer (optional)</Label>
              <CustomerLookup
                value={customerId}
                onChange={(id) => setCustomerId(id)}
                onClear={() => setCustomerId('')}
              />
            </div>
          )}
          {form.type === 'PAYMENT' && (
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Link to Vendor (optional)</Label>
              <VendorLookup
                value={vendorId}
                onChange={(id) => setVendorId(id)}
                onClear={() => setVendorId('')}
              />
            </div>
          )}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Contra Account *</Label>
            <select
              value={form.contraAccountId}
              onChange={e => set('contraAccountId', e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">— Select account —</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : `Record ${form.type === 'RECEIPT' ? 'Receipt' : 'Payment'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CashBookPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [biz, setBiz] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/profile').then(r => r.ok ? r.json() : null).then(d => { if (d) setBiz(d); }).catch(() => {});
  }, []);
  const { from: defaultFrom, to: defaultTo } = getMonthRange();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/cash-book?from=${from}&to=${to}`);
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Entry #', 'Description', 'Receipts (Dr)', 'Payments (Cr)', 'Running Balance'],
      [`Opening Balance`, '', '', '', '', fmt(data.openingBalance)],
      ...(data.lines ?? []).map((l: any) => [
        new Date(l.date).toLocaleDateString('en-NG'),
        l.entryNumber,
        l.description ?? '',
        l.debit > 0 ? l.debit.toFixed(2) : '',
        l.credit > 0 ? l.credit.toFixed(2) : '',
        l.runningBalance.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `cash-book-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const lines: any[] = data?.lines ?? [];
  const totals = data?.totals ?? { totalReceipts: 0, totalPayments: 0, closingBalance: 0 };

  return (
    <div className="space-y-5">
      {showRecord && (
        <RecordCashModal onClose={() => setShowRecord(false)} onSaved={() => { setShowRecord(false); load(); }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Cash Book
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.account ? `${data.account.code} — ${data.account.name}` : 'Running ledger for cash account'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}><Download className="w-3.5 h-3.5 mr-1.5" />Export CSV</Button>
          <Button size="sm" onClick={() => setShowRecord(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Record Transaction</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-xl w-40" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Opening Balance</p>
          <p className="text-lg font-bold">₦{loading ? '—' : fmt(data?.openingBalance ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Receipts</p>
          <p className="text-lg font-bold" style={{ color: 'hsl(168 84% 26%)' }}>₦{loading ? '—' : fmt(totals.totalReceipts)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Payments</p>
          <p className="text-lg font-bold text-destructive">₦{loading ? '—' : fmt(totals.totalPayments)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Closing Balance</p>
          <p className="text-lg font-bold" style={{ color: 'hsl(40 78% 47%)' }}>₦{loading ? '—' : fmt(totals.closingBalance)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Entry #</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Description</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Receipts (Dr)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Payments (Cr)</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Balance</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              {!loading && data && (
                <tr className="border-b border-border/40 bg-muted/20">
                  <td className="py-2.5 px-4 text-muted-foreground text-xs" colSpan={2}>{from}</td>
                  <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground">Opening Balance</td>
                  <td className="py-2.5 px-4 text-right" />
                  <td className="py-2.5 px-4 text-right" />
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">₦{fmt(data.openingBalance)}</td>
                  <td className="py-2.5 px-4" />
                </tr>
              )}
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Banknote className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No cash transactions in this period</p>
                  </td>
                </tr>
              ) : (
                lines.map((l: any, idx: number) => (
                  <tr key={l.id ?? idx} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-sm">
                      {new Date(l.date).toLocaleDateString('en-NG')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs">{l.entryNumber}</td>
                    <td className="py-2.5 px-4 text-sm">
                      <p>{l.description}</p>
                      {l.reference && <p className="text-xs text-muted-foreground">{l.reference}</p>}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm" style={{ color: l.debit > 0 ? 'hsl(168 84% 26%)' : undefined }}>
                      {l.debit > 0 ? `₦${fmt(l.debit)}` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm text-destructive">
                      {l.credit > 0 ? `₦${fmt(l.credit)}` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm font-semibold">
                      ₦{fmt(l.runningBalance)}
                    </td>
                    <td className="py-2.5 px-4">
                      {l.debit > 0 && (
                        <button
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
                          onClick={() => printReceipt({
                            receiptNumber: l.reference || l.entryNumber,
                            date: l.date,
                            customerName:  l.customer?.name  || l.customer?.phone,
                            customerPhone: l.customer?.phone,
                            customerEmail: l.customer?.email,
                            paymentMethod: 'Cash',
                            lines: [{ description: l.description || 'Cash Receipt', amount: l.debit }],
                            total: l.debit,
                          }, biz)}
                        >
                          <ReceiptText className="w-3 h-3" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {/* Closing balance row */}
              {!loading && lines.length > 0 && (
                <tr className="border-t-2 border-border bg-muted/20">
                  <td className="py-2.5 px-4 text-xs" colSpan={2}>{to}</td>
                  <td className="py-2.5 px-4 text-xs font-bold">Closing Balance</td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold" style={{ color: 'hsl(168 84% 26%)' }}>
                    ₦{fmt(totals.totalReceipts)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-destructive">
                    ₦{fmt(totals.totalPayments)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-sm font-bold" style={{ color: 'hsl(40 78% 47%)' }}>
                    ₦{fmt(totals.closingBalance)}
                  </td>
                  <td className="py-2.5 px-4" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
