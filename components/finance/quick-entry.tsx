'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, X, TrendingUp, TrendingDown, Landmark, CreditCard, ChevronRight,
  Sparkles, AlertTriangle, AlertCircle, Loader2, User, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type EntryType = 'sale' | 'expense' | 'cash-receipt' | 'cash-payment' | null;

interface Customer { id: string; name: string; phone?: string; email?: string; customerCode?: string; }

const ENTRY_TYPES = [
  { id: 'sale'         as const, label: 'Record Sale',    icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200', desc: 'Sales / revenue received' },
  { id: 'expense'      as const, label: 'Record Expense', icon: TrendingDown, color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200',                 desc: 'Purchase / expense paid'  },
  { id: 'cash-receipt' as const, label: 'Cash Receipt',   icon: Landmark,     color: 'text-sky-600 bg-sky-50 hover:bg-sky-100 border-sky-200',                 desc: 'Cash in from any source'  },
  { id: 'cash-payment' as const, label: 'Cash Payment',   icon: CreditCard,   color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200',     desc: 'Cash out to any payee'    },
];

function today() { return new Date().toISOString().slice(0, 10); }

// ── Customer search combobox ──────────────────────────────────────────────────
function CustomerPicker({
  value, onChange, label = 'Customer',
}: {
  value: { id: string; name: string } | null;
  onChange: (c: { id: string; name: string } | null) => void;
  label?: string;
}) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<Customer[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (!open || query.length < 1) { setResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setResults(data.customers ?? []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, open]);

  function select(c: Customer) {
    onChange({ id: c.id, name: c.name });
    setQuery('');
    setOpen(false);
  }

  function clear() { onChange(null); setQuery(''); }

  return (
    <div ref={wrapRef} className="relative space-y-1.5">
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 text-sm">
          <User className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="flex-1 font-medium">{value.name}</span>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 text-sm"
            placeholder="Search by name, phone or code…"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
          />
          {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
      )}

      {open && !value && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {results.length === 0 && query.length >= 1 && !loading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No customers found for "{query}"</p>
          )}
          {query.length < 1 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Type to search customers…</p>
          )}
          {results.map(c => (
            <button
              key={c.id} type="button"
              onClick={() => select(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{[c.customerCode, c.phone, c.email].filter(Boolean).join(' · ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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

  // Customer (sale + cash-receipt)
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);

  // Sale-specific
  const [vatAmount, setVatAmount] = useState('0');

  // Expense-specific
  const [vendorName, setVendorName]         = useState('');
  const [expenseAccountId, setExpenseAccId] = useState('');
  const [expenseVat, setExpenseVat]         = useState('0');

  // Cash receipt / payment
  const [contraAccountId, setContraAccId] = useState('');

  // AI state
  const [suggestion, setSuggestion]       = useState<any>(null);
  const [suggesting, setSuggesting]       = useState(false);
  const [duplicates, setDuplicates]       = useState<any[]>([]);
  const [anomalies, setAnomalies]         = useState<any[]>([]);
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

  // AI account suggestion (expense only)
  useEffect(() => {
    if (type !== 'expense' || description.length < 5) { setSuggestion(null); return; }
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res  = await fetch('/api/finance/ai/suggest-account', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    setCustomer(null); setVatAmount('0');
    setVendorName(''); setExpenseAccId(''); setExpenseVat('0');
    setContraAccId('');
    setSuggestion(null); setDuplicates([]); setAnomalies([]); setDismissedDups(false);
  }

  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');
  const contraAccounts  = accounts.filter(a => ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].includes(a.accountType));

  async function checkBeforePost(): Promise<boolean> {
    const checks: Promise<void>[] = [];

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

    if (amount && Number(amount) > 0 && type === 'expense') {
      checks.push(
        fetch('/api/finance/ai/check-anomaly', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lines: [{ accountType: 'EXPENSE', accountCode: '', accountName: 'Expense', debit: Number(amount), credit: 0 }],
            entryDate: date, totalAmount: Number(amount),
          }),
        })
          .then(r => r.json())
          .then(d => { if (d.anomalies?.length) setAnomalies(d.anomalies); })
          .catch(() => {}),
      );
    }

    await Promise.all(checks);
    if (duplicates.length > 0 && !dismissedDups) return false;
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await checkBeforePost();
      if (!ok) { setSaving(false); return; }

      let url = ''; let body: any = {};

      if (type === 'sale') {
        url  = '/api/finance/sales-book/record';
        body = {
          date, description,
          amount:        Number(amount),
          vatAmount:     Number(vatAmount),
          paymentMethod: payMethod,
          customerId:    customer?.id   ?? undefined,
          customerName:  customer?.name ?? undefined,
        };
      } else if (type === 'expense') {
        url  = '/api/finance/purchase-book/record';
        body = {
          date, description,
          amount:            Number(amount),
          vatAmount:         Number(expenseVat),
          paymentMethod:     payMethod,
          vendorName,
          expenseAccountId,
        };
      } else if (type === 'cash-receipt') {
        url  = '/api/finance/cash-book/record';
        body = {
          type:            'RECEIPT',
          date, description,
          amount:          Number(amount),
          contraAccountId,
          customerId:      customer?.id   ?? undefined,
          customerName:    customer?.name ?? undefined,
        };
      } else if (type === 'cash-payment') {
        url  = '/api/finance/cash-book/record';
        body = {
          type:            'PAYMENT',
          date, description,
          amount:          Number(amount),
          contraAccountId,
        };
      }

      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to record transaction'); return; }
      toast.success(`Transaction posted${customer ? ` for ${customer.name}` : ''}`);
      setOpen(false);
    } finally { setSaving(false); }
  }

  const selectedType   = ENTRY_TYPES.find(t => t.id === type);
  const errorAnomalies = anomalies.filter(a => a.severity === 'error');
  const warnAnomalies  = anomalies.filter(a => a.severity === 'warning');

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

                  {/* Customer picker — shown for Sale and Cash Receipt */}
                  {(type === 'sale' || type === 'cash-receipt') && (
                    <CustomerPicker
                      value={customer}
                      onChange={setCustomer}
                      label={type === 'sale' ? 'Customer (links to customer record)' : 'Customer (optional)'}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date *</Label>
                      <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Amount *</Label>
                      <Input type="number" required min="0.01" step="0.01" placeholder="0.00"
                        value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description *</Label>
                    <Input required placeholder={
                      type === 'sale'         ? 'e.g. Sale of goods' :
                      type === 'expense'      ? 'e.g. EKEDC electricity bill' :
                      type === 'cash-receipt' ? 'e.g. Payment received' :
                                               'e.g. Utility payment'
                    } value={description}
                      onChange={e => { setDesc(e.target.value); setDuplicates([]); setAnomalies([]); setDismissedDups(false); }} />
                  </div>

                  {/* AI suggestion banner (expense only) */}
                  {type === 'expense' && (
                    <div className="min-h-[28px]">
                      {suggesting && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> AI suggesting account…
                        </p>
                      )}
                      {suggestion && !suggesting && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="flex-1">
                            <span className="font-semibold text-primary">AI suggests:</span> {suggestion.accountCode} — {suggestion.accountName}
                            <Badge variant="outline" className="ml-1 text-[10px] py-0">{suggestion.confidence}</Badge>
                          </span>
                          <button type="button" onClick={() => { setExpenseAccId(suggestion.accountId); setSuggestion(null); }}
                            className="text-primary font-semibold hover:underline">Apply</button>
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
                          {d.existingEntryNumber} ({d.daysDiff === 0 ? 'today' : `${d.daysDiff}d ago`}) — ₦{d.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </p>
                      ))}
                      <div className="flex gap-3 pt-1">
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
                  {warnAnomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a.message}
                    </div>
                  ))}

                  {/* Sale-specific */}
                  {type === 'sale' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>VAT Amount</Label>
                        <Input type="number" min="0" step="0.01" placeholder="0.00"
                          value={vatAmount} onChange={e => setVatAmount(e.target.value)} />
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

                  {/* Expense-specific */}
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
                          <Input placeholder="Sundry Vendor" value={vendorName}
                            onChange={e => setVendorName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>VAT Amount</Label>
                          <Input type="number" min="0" step="0.01" placeholder="0.00"
                            value={expenseVat} onChange={e => setExpenseVat(e.target.value)} />
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

                  {/* Cash Receipt-specific */}
                  {type === 'cash-receipt' && (
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
                      <p className="text-xs text-muted-foreground">Account being credited (source of cash)</p>
                    </div>
                  )}

                  {/* Cash Payment-specific */}
                  {type === 'cash-payment' && (
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
                      <p className="text-xs text-muted-foreground">Account being debited (use of cash)</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setType(null)}>Back</Button>
                    <Button type="submit" className="flex-1" disabled={saving || errorAnomalies.length > 0}>
                      {saving
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Posting…</>
                        : 'Post Transaction'}
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
