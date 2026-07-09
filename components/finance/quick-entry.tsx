'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Landmark, CreditCard, ChevronRight, Sparkles, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type EntryType = 'sale' | 'expense' | 'cash-receipt' | 'cash-payment' | null;

const ENTRY_TYPES = [
  { id: 'sale'         as const, label: 'Record Sale',    icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200', desc: 'Sales / revenue received' },
  { id: 'expense'      as const, label: 'Record Expense', icon: TrendingDown, color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200',                 desc: 'Purchase / expense paid'  },
  { id: 'cash-receipt' as const, label: 'Cash Receipt',   icon: Landmark,     color: 'text-sky-600 bg-sky-50 hover:bg-sky-100 border-sky-200',                 desc: 'Cash in from any source'  },
  { id: 'cash-payment' as const, label: 'Cash Payment',   icon: CreditCard,   color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200',     desc: 'Cash out to any payee'    },
];

function today() { return new Date().toISOString().slice(0, 10); }

export default function QuickEntry() {
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState<EntryType>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Shared fields
  const [date, setDate]           = useState(today());
  const [description, setDesc]    = useState('');
  const [amount, setAmount]       = useState('');
  const [payMethod, setPayMethod] = useState('CASH');

  // Sale-specific
  const [customerName, setCustomerName] = useState('');
  const [vatAmount, setVatAmount]       = useState('0');

  // Expense-specific
  const [vendorName, setVendorName]         = useState('');
  const [expenseAccountId, setExpenseAccId] = useState('');
  const [expenseVat, setExpenseVat]         = useState('0');

  // Cash receipt / payment
  const [contraAccountId, setContraAccId] = useState('');

  // AI state
  const [suggestion, setSuggestion]     = useState<any>(null);
  const [suggesting, setSuggesting]     = useState(false);
  const [duplicates, setDuplicates]     = useState<any[]>([]);
  const [anomalies, setAnomalies]       = useState<any[]>([]);
  const [dismissedDups, setDismissedDups] = useState(false);

  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setType(null); resetFields(); return; }
    fetch('/api/finance/accounts?pageSize=200')
      .then(r => r.json())
      .then(d => setAccounts(d.accounts ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Debounced AI suggest-account on description change (expense only)
  useEffect(() => {
    if (type !== 'expense' || description.length < 5) { setSuggestion(null); return; }
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await fetch('/api/finance/ai/suggest-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, transactionType: 'expense' }),
        });
        const data = await res.json();
        if (data.suggestion) setSuggestion(data.suggestion);
      } catch { /* ignore */ }
      setSuggesting(false);
    }, 800);
    return () => { if (descTimer.current) clearTimeout(descTimer.current); };
  }, [description, type]);

  function resetFields() {
    setDate(today()); setDesc(''); setAmount(''); setPayMethod('CASH');
    setCustomerName(''); setVatAmount('0');
    setVendorName(''); setExpenseAccId(''); setExpenseVat('0');
    setContraAccId('');
    setSuggestion(null); setDuplicates([]); setAnomalies([]); setDismissedDups(false);
  }

  function applySuggestion() {
    if (suggestion) { setExpenseAccId(suggestion.accountId); setSuggestion(null); }
  }

  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');
  const contraAccounts  = accounts.filter(a => ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].includes(a.accountType));

  async function checkBeforePost(): Promise<boolean> {
    const checks: Promise<void>[] = [];

    // Duplicate check for expenses
    if ((type === 'expense' || type === 'cash-payment') && amount && description) {
      checks.push(
        fetch('/api/finance/ai/check-duplicate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), description, date }),
        })
          .then(r => r.json())
          .then(d => { if (d.warnings?.length) setDuplicates(d.warnings); })
          .catch(() => {}),
      );
    }

    // Anomaly check
    if (amount && Number(amount) > 0) {
      const lines = type === 'expense'
        ? [{ accountType: 'EXPENSE', accountCode: '', accountName: 'Expense', debit: Number(amount), credit: 0 }]
        : [];
      if (lines.length > 0) {
        checks.push(
          fetch('/api/finance/ai/check-anomaly', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lines, entryDate: date, totalAmount: Number(amount) }),
          })
            .then(r => r.json())
            .then(d => { if (d.anomalies?.length) setAnomalies(d.anomalies); })
            .catch(() => {}),
        );
      }
    }

    await Promise.all(checks);

    // If new duplicates found and not yet dismissed — block
    if (duplicates.length > 0 && !dismissedDups) return false;
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Run AI checks first
      const ok = await checkBeforePost();
      if (!ok) { setSaving(false); return; } // show warnings in UI

      let url = ''; let body: any = {};
      if (type === 'sale') {
        url  = '/api/finance/sales-book/record';
        body = { date, description, amount: Number(amount), vatAmount: Number(vatAmount), paymentMethod: payMethod, customerName };
      } else if (type === 'expense') {
        url  = '/api/finance/purchase-book/record';
        body = { date, description, amount: Number(amount), vatAmount: Number(expenseVat), paymentMethod: payMethod, vendorName, expenseAccountId };
      } else if (type === 'cash-receipt') {
        url  = '/api/finance/cash-book/record';
        body = { type: 'RECEIPT', date, description, amount: Number(amount), contraAccountId };
      } else if (type === 'cash-payment') {
        url  = '/api/finance/cash-book/record';
        body = { type: 'PAYMENT', date, description, amount: Number(amount), contraAccountId };
      }

      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to record transaction'); return; }
      toast.success('Transaction recorded successfully');
      setOpen(false);
    } finally { setSaving(false); }
  }

  const selectedType = ENTRY_TYPES.find(t => t.id === type);
  const errorAnomalies   = anomalies.filter(a => a.severity === 'error');
  const warningAnomalies = anomalies.filter(a => a.severity === 'warning');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Quick Entry"
      >
        <Plus className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div ref={panelRef} className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                {type && (
                  <button onClick={() => setType(null)} className="text-muted-foreground hover:text-foreground mr-1">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <h2 className="font-semibold text-base">{type ? selectedType?.label : 'Quick Entry'}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Type selector */}
              {!type && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">What do you want to record?</p>
                  {ENTRY_TYPES.map(et => (
                    <button key={et.id} onClick={() => setType(et.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${et.color}`}>
                      <et.icon className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{et.label}</p>
                        <p className="text-xs opacity-75">{et.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Form */}
              {type && (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date *</Label>
                      <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Amount *</Label>
                      <Input type="number" required min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description *</Label>
                    <Input required placeholder={
                      type === 'sale'         ? 'e.g. Sale of goods to ABC Ltd' :
                      type === 'expense'      ? 'e.g. EKEDC electricity bill' :
                      type === 'cash-receipt' ? 'e.g. Cash received from customer' :
                                               'e.g. Payment for utilities'
                    } value={description} onChange={e => { setDesc(e.target.value); setDuplicates([]); setAnomalies([]); setDismissedDups(false); }} />
                  </div>

                  {/* AI suggestion banner */}
                  {type === 'expense' && (
                    <div className="min-h-[28px]">
                      {suggesting && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> AI is suggesting an account…
                        </p>
                      )}
                      {suggestion && !suggesting && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="flex-1">
                            <span className="font-semibold text-primary">AI suggests:</span> {suggestion.accountCode} — {suggestion.accountName}
                            <Badge variant="outline" className="ml-1 text-[10px] py-0">{suggestion.confidence}</Badge>
                          </span>
                          <button type="button" onClick={applySuggestion} className="text-primary font-semibold hover:underline">Apply</button>
                          <button type="button" onClick={() => setSuggestion(null)} className="text-muted-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duplicate warnings */}
                  {duplicates.length > 0 && !dismissedDups && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Possible duplicate detected
                      </p>
                      {duplicates.map((d, i) => (
                        <p key={i} className="text-xs text-amber-700">
                          Entry {d.existingEntryNumber} ({d.daysDiff === 0 ? 'today' : `${d.daysDiff}d ago`}) — ₦{d.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} — {d.existingDescription}
                        </p>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setDismissedDups(true)}
                          className="text-xs text-amber-800 font-medium underline">Post anyway</button>
                        <button type="button" onClick={() => { setDuplicates([]); setOpen(false); }}
                          className="text-xs text-amber-800 font-medium underline">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Anomaly warnings */}
                  {errorAnomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a.message}
                    </div>
                  ))}
                  {warningAnomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a.message}
                    </div>
                  ))}

                  {/* Sale fields */}
                  {type === 'sale' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Customer Name</Label>
                          <Input placeholder="Sundry Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>VAT Amount</Label>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" value={vatAmount} onChange={e => setVatAmount(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Payment Method *</Label>
                        <Select value={payMethod} onValueChange={setPayMethod}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK">Bank Transfer</SelectItem>
                            <SelectItem value="INVOICE">On Credit (AR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Expense fields */}
                  {type === 'expense' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Expense Account *</Label>
                        <Select required value={expenseAccountId} onValueChange={setExpenseAccId}>
                          <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                          <SelectContent>
                            {expenseAccounts.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Vendor Name</Label>
                          <Input placeholder="Sundry Vendor" value={vendorName} onChange={e => setVendorName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>VAT Amount</Label>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" value={expenseVat} onChange={e => setExpenseVat(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Payment Method *</Label>
                        <Select value={payMethod} onValueChange={setPayMethod}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK">Bank Transfer</SelectItem>
                            <SelectItem value="ON_CREDIT">On Credit (AP)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Cash fields */}
                  {(type === 'cash-receipt' || type === 'cash-payment') && (
                    <div className="space-y-1.5">
                      <Label>Contra Account *</Label>
                      <Select required value={contraAccountId} onValueChange={setContraAccId}>
                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                          {contraAccounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {type === 'cash-receipt' ? 'Account being credited (source)' : 'Account being debited (use of cash)'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setType(null)}>Back</Button>
                    <Button type="submit" className="flex-1" disabled={saving || errorAnomalies.length > 0}>
                      {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Posting…</> : 'Post Transaction'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
