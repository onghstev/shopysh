'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Download, RefreshCw, ChevronLeft, ChevronRight, BookOpen, Plus, X,
  Hash, Percent, Loader2, RotateCcw, Printer, ReceiptText, Trash2,
} from 'lucide-react';
import { printReceipt } from '@/lib/print-receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CustomerLookup from '@/components/finance/CustomerLookup';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });

// ── Print invoice in an isolated popup window ─────────────────────────────────
function printInvoice(entry: any, biz: any) {
  const salesLine = entry.lines?.find((l: any) => l.account?.systemTag === 'SALES');
  const vatLine   = entry.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
  const arLine    = entry.lines?.find((l: any) => l.account?.systemTag === 'AR');
  const customer  = arLine?.customer;

  // All Sales credit lines = individual invoice items
  const salesLines  = (entry.lines ?? []).filter((l: any) => l.account?.systemTag === 'SALES' && Number(l.credit) > 0);
  const subtotal    = salesLines.reduce((s: number, l: any) => s + Number(l.credit), 0) || 0;
  const vatAmt      = vatLine   ? Number(vatLine.credit)   : 0;
  const total       = Number(entry.totalDebit);
  const fmtN        = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const invoiceDate = new Date(entry.entryDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const ref         = entry.reference || entry.entryNumber;

  // Business header lines (only render non-empty values)
  const bizName    = biz?.businessName || biz?.name || '';
  const bizAddress = [biz?.city, biz?.state, biz?.country].filter(Boolean).join(', ');
  const bizPhone   = biz?.phone  || '';
  const bizEmail   = biz?.email  || '';
  const bizHeader  = [
    bizName    ? `<div style="font-size:20px;font-weight:800;color:#1a1a1a">${bizName}</div>` : '',
    bizAddress ? `<div style="font-size:13px;color:#6b7280;margin-top:2px">${bizAddress}</div>` : '',
    bizPhone   ? `<div style="font-size:13px;color:#6b7280">Tel: ${bizPhone}</div>` : '',
    bizEmail   ? `<div style="font-size:13px;color:#6b7280">${bizEmail}</div>` : '',
  ].join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${ref}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; padding: 48px; }
    h1 { font-size: 36px; font-weight: 900; color: hsl(168,84%,26%); letter-spacing: -1px; }
    h2 { font-size: 18px; font-weight: 700; margin-top: 4px; color: #333; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 24px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
    .meta-line { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .meta-line span:first-child { color: #9ca3af; }
    .meta-line span:last-child { font-weight: 600; }
    .ref { color: hsl(168,84%,26%); font-family: monospace; }
    .gl  { color: #9ca3af; font-family: monospace; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 8px; }
    thead tr { background: #f9fafb; }
    th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; border-bottom: 1px solid #e5e7eb; }
    th:last-child { text-align: right; }
    td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    td:last-child { text-align: right; font-family: monospace; }
    .vat-row td { background: #fffbeb; color: #b45309; }
    tfoot tr { background: #f9fafb; border-top: 2px solid #d1d5db; }
    tfoot td { font-weight: 700; font-size: 16px; padding: 14px 16px; }
    tfoot td:last-child { color: hsl(168,84%,26%); font-size: 18px; font-family: monospace; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { padding: 32px; } }
  </style>
</head>
<body>
  <div class="row" style="align-items:flex-start">
    <div>
      <h1>INVOICE</h1>
      <h2>${ref}</h2>
    </div>
    <div style="text-align:right">${bizHeader}</div>
  </div>
  <hr/>
  <div class="row">
    <div style="flex:1">
      <div class="label">Bill To</div>
      ${customer
        ? `<div style="font-weight:700;font-size:15px">${customer.name || customer.phone}</div>
           ${customer.email ? `<div style="color:#6b7280;font-size:13px">${customer.email}</div>` : ''}
           ${customer.phone ? `<div style="color:#6b7280;font-size:13px">${customer.phone}</div>` : ''}`
        : `<div style="color:#9ca3af;font-style:italic">Sundry / Walk-in Customer</div>`}
    </div>
    <div style="min-width:200px">
      <div class="meta-line"><span>Invoice Date</span><span>${invoiceDate}</span></div>
      <div class="meta-line"><span>Reference</span><span class="ref">${ref}</span></div>
      <div class="meta-line"><span>GL Entry</span><span class="gl">${entry.entryNumber}</span></div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>
      ${salesLines.length > 0
        ? salesLines.map((l: any) => `<tr><td>${l.description || ''}</td><td>₦${fmtN(Number(l.credit))}</td></tr>`).join('')
        : `<tr><td>${entry.description?.split('—')[0]?.trim() || entry.description || ''}</td><td>₦${fmtN(subtotal)}</td></tr>`
      }
      ${vatAmt > 0 ? `<tr class="vat-row"><td>VAT</td><td>₦${fmtN(vatAmt)}</td></tr>` : ''}
    </tbody>
    <tfoot>
      <tr><td>Total Due</td><td>₦${fmtN(total)}</td></tr>
    </tfoot>
  </table>
  <div class="footer">
    <p>Thank you for your business.</p>
    ${vatAmt > 0 ? `<p>This invoice includes VAT of ₦${fmtN(vatAmt)}.</p>` : ''}
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Print receipt for cash/bank sales ────────────────────────────────────────
function printSaleReceipt(entry: any, biz: any) {
  const salesLines = (entry.lines ?? []).filter((l: any) => l.account?.systemTag === 'SALES' && Number(l.credit) > 0);
  const vatLine    = entry.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
  // Customer is on the Cash/Bank debit line
  const cashLine   = entry.lines?.find((l: any) => ['CASH', 'BANK'].includes(l.account?.systemTag ?? '') && Number(l.debit) > 0);
  const customer   = cashLine?.customer;
  const vatAmt     = vatLine ? Number(vatLine.credit) : 0;
  const subtotal   = salesLines.reduce((s: number, l: any) => s + Number(l.credit), 0);
  const payMethod  = entry.entryType === 'SALES_RECEIPT'
    ? (entry.lines?.find((l: any) => l.account?.systemTag === 'BANK') ? 'Bank Transfer' : 'Cash')
    : '';

  printReceipt({
    receiptNumber: entry.reference || entry.entryNumber,
    date: entry.entryDate,
    customerName:  customer?.name  || customer?.phone,
    customerPhone: customer?.phone,
    customerEmail: customer?.email,
    paymentMethod: payMethod,
    lines: salesLines.length > 0
      ? salesLines.map((l: any) => ({ description: l.description || 'Sale', amount: Number(l.credit) }))
      : [{ description: entry.description || 'Sale', amount: subtotal }],
    subtotal,
    tax: vatAmt,
    total: Number(entry.totalDebit),
  }, biz);
}

// ── Invoice preview modal (before printing) ───────────────────────────────────
function InvoicePrintView({ entry, biz, onClose }: { entry: any; biz: any; onClose: () => void }) {
  const salesLines2 = (entry.lines ?? []).filter((l: any) => l.account?.systemTag === 'SALES' && Number(l.credit) > 0);
  const vatLine     = entry.lines?.find((l: any) => l.account?.systemTag === 'VAT_OUTPUT');
  const arLine      = entry.lines?.find((l: any) => l.account?.systemTag === 'AR');
  const customer    = arLine?.customer;

  const subtotal    = salesLines2.reduce((s: number, l: any) => s + Number(l.credit), 0);
  const vatAmt      = vatLine ? Number(vatLine.credit) : 0;
  const total       = Number(entry.totalDebit);
  const invoiceDate = new Date(entry.entryDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-sm text-muted-foreground">Invoice Preview — {entry.reference || entry.entryNumber}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => printInvoice(entry, biz)}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save PDF
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'hsl(168 84% 26%)' }}>INVOICE</h1>
              <p className="text-xl font-semibold mt-1">{entry.reference || entry.entryNumber}</p>
            </div>
            {biz && (
              <div className="text-right">
                {(biz.businessName || biz.name) && (
                  <p className="font-bold text-base">{biz.businessName || biz.name}</p>
                )}
                {[biz.city, biz.state, biz.country].filter(Boolean).length > 0 && (
                  <p className="text-sm text-gray-500">{[biz.city, biz.state, biz.country].filter(Boolean).join(', ')}</p>
                )}
                {biz.phone && <p className="text-sm text-gray-500">Tel: {biz.phone}</p>}
                {biz.email && <p className="text-sm text-gray-500">{biz.email}</p>}
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Bill To</p>
              {customer ? (
                <>
                  <p className="font-semibold text-base">{customer.name || customer.phone}</p>
                  {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                  {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                  {customer.customerCode && <p className="text-xs text-gray-400 font-mono">{customer.customerCode}</p>}
                </>
              ) : (
                <p className="text-gray-400 italic">Sundry / Walk-in Customer</p>
              )}
            </div>
            <div className="text-right space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Invoice Date</span>
                <span className="font-medium">{invoiceDate}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Reference</span>
                <span className="font-mono font-semibold" style={{ color: 'hsl(168 84% 26%)' }}>
                  {entry.reference || entry.entryNumber}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">GL Entry</span>
                <span className="font-mono text-xs text-gray-400">{entry.entryNumber}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {salesLines2.length > 0
                  ? salesLines2.map((l: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-800">{l.description}</td>
                        <td className="py-3 px-4 text-right font-mono">₦{fmt(Number(l.credit))}</td>
                      </tr>
                    ))
                  : (
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-800">{entry.description?.split('—')[0]?.trim() || entry.description}</td>
                        <td className="py-3 px-4 text-right font-mono">₦{fmt(subtotal)}</td>
                      </tr>
                    )
                }
                {vatAmt > 0 && (
                  <tr className="bg-amber-50/50 border-b border-gray-100">
                    <td className="py-3 px-4 text-amber-700 text-sm">VAT</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">₦{fmt(vatAmt)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-4 px-4 font-bold text-lg">Total Due</td>
                  <td className="py-4 px-4 text-right font-bold text-xl" style={{ color: 'hsl(168 84% 26%)' }}>
                    ₦{fmt(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100 space-y-1">
            <p>Thank you for your business.</p>
            {vatAmt > 0 && <p>This invoice includes VAT of ₦{fmt(vatAmt)}.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // Always regenerate when prefix changes (payment method switch) or on first mount
  useEffect(() => { generate(); }, [prefix]); // eslint-disable-line react-hooks/exhaustive-deps

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
type SaleItem = { id: number; description: string; qty: string; unitPrice: string };

let _itemId = 0;
const newItem = (): SaleItem => ({ id: ++_itemId, description: '', qty: '1', unitPrice: '' });

function RecordSaleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]                 = useState(today);
  const [reference, setReference]       = useState('');
  const [paymentMethod, setPayMethod]   = useState('INVOICE');
  const [vatAmount, setVatAmount]       = useState('0');
  const [customerId, setCustomerId]     = useState('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems]               = useState<SaleItem[]>([newItem()]);
  const [saving, setSaving]             = useState(false);

  const updateItem = (id: number, field: keyof SaleItem, val: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  const addItem    = () => setItems(prev => [...prev, newItem()]);
  const removeItem = (id: number) => setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);

  const lineTotal = (it: SaleItem) => (parseFloat(it.qty) || 1) * (parseFloat(it.unitPrice) || 0);
  const subtotal  = items.reduce((s, it) => s + lineTotal(it), 0);
  const vatAmt    = parseFloat(vatAmount) || 0;
  const total     = subtotal + vatAmt;

  const handleSubmit = async () => {
    if (!date || !paymentMethod) { toast.error('Date and payment method are required'); return; }
    if (!reference) { toast.error('Reference is required — click ↺ to generate one'); return; }
    if (items.some(it => !it.description.trim() || lineTotal(it) <= 0)) {
      toast.error('Each item must have a description and a price greater than zero'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/sales-book/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date, reference, paymentMethod,
          vatAmount: vatAmt,
          customerId:   customerId   || undefined,
          customerName: customerName || 'Sundry Customer',
          items: items.map(it => ({
            description: it.description.trim(),
            qty:         parseFloat(it.qty)       || 1,
            unitPrice:   parseFloat(it.unitPrice)  || 0,
            lineTotal:   lineTotal(it),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Sale recorded successfully');
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl my-6 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Record Sale</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Header fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> Reference *</Label>
            <RefInput value={reference} onChange={setReference} paymentMethod={paymentMethod} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Customer</Label>
            <CustomerLookup
              value={customerId} displayName={customerName}
              onChange={(id, name) => { setCustomerId(id); setCustomerName(name); }}
              onClear={() => { setCustomerId(''); setCustomerName(''); }}
            />
          </div>
        </div>

        {/* Line items table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Line Items *</Label>
            <button
              type="button" onClick={addItem}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground w-[45%]">Description</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground w-16">Qty</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Unit Price</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2">
                      <Input
                        value={it.description}
                        onChange={e => updateItem(it.id, 'description', e.target.value)}
                        placeholder="e.g. Consulting services"
                        className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 px-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number" min="0.01" step="any"
                        value={it.qty}
                        onChange={e => updateItem(it.id, 'qty', e.target.value)}
                        className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 px-0 w-14"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number" min="0" step="0.01"
                        value={it.unitPrice}
                        onChange={e => updateItem(it.id, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 px-0"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap">
                      {lineTotal(it) > 0 ? `₦${fmt(lineTotal(it))}` : '—'}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        disabled={items.length === 1}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VAT + Payment Method */}
        <div className="grid grid-cols-2 gap-3">
          <VATInput
            amount={String(subtotal)}
            vatAmount={vatAmount}
            onVatChange={setVatAmount}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Method *</Label>
            <div className="flex gap-1.5">
              {[
                { value: 'INVOICE', label: 'On Credit' },
                { value: 'CASH',    label: 'Cash'      },
                { value: 'BANK',    label: 'Bank'      },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPayMethod(opt.value); setReference(''); }}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    paymentMethod === opt.value
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

        {/* Totals */}
        {subtotal > 0 && (
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            {items.filter(it => lineTotal(it) > 0).map(it => (
              <div key={it.id} className="flex justify-between text-muted-foreground text-xs">
                <span className="truncate mr-4">{it.description || 'Item'}</span>
                <span className="font-mono">₦{fmt(lineTotal(it))}</span>
              </div>
            ))}
            <div className="flex justify-between text-muted-foreground pt-1 border-t border-border">
              <span>Subtotal</span><span className="font-mono">₦{fmt(subtotal)}</span>
            </div>
            {vatAmt > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>VAT (→ VAT Output GL)</span>
                <span className="font-mono">₦{fmt(vatAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-border text-base">
              <span>Total</span><span className="font-mono">₦{fmt(total)}</span>
            </div>
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
  const [entries, setEntries]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [totals, setTotals]         = useState({ totalDebit: 0, totalCredit: 0 });
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [showRecord, setShowRecord] = useState(false);
  const [printing, setPrinting]     = useState<any>(null);
  const [biz, setBiz]               = useState<any>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
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

  // Fetch business profile once for invoice header
  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(d => setBiz(d.tenant ?? null))
      .catch(() => {});
  }, []);

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this DRAFT entry? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/finance/journal/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Entry deleted'); load(); }
      else { const d = await res.json(); toast.error(d.error || 'Failed to delete'); }
    } finally { setDeleting(null); }
  };

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
      {printing && <InvoicePrintView entry={printing} biz={biz} onClose={() => setPrinting(null)} />}

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
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
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
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          e.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700'
                          : e.status === 'DRAFT' ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {e.entryType === 'SALES_INVOICE' && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-xs gap-1 whitespace-nowrap"
                              onClick={() => setPrinting(e)}
                            >
                              <Printer className="w-3 h-3" /> Invoice
                            </Button>
                          )}
                          {e.entryType === 'SALES_RECEIPT' && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 px-2 text-xs gap-1 whitespace-nowrap"
                              onClick={() => printSaleReceipt(e, biz)}
                            >
                              <ReceiptText className="w-3 h-3" /> Receipt
                            </Button>
                          )}
                          {e.status === 'DRAFT' && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleting === e.id}
                              onClick={() => deleteEntry(e.id)}
                            >
                              {deleting === e.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Trash2 className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
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
