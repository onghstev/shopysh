'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Landmark, CreditCard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type EntryType = 'sale' | 'expense' | 'cash-receipt' | 'cash-payment' | null;

const ENTRY_TYPES = [
  { id: 'sale'         as const, label: 'Record Sale',         icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200', desc: 'Sales / revenue received' },
  { id: 'expense'      as const, label: 'Record Expense',      icon: TrendingDown, color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200',                 desc: 'Purchase / expense paid'  },
  { id: 'cash-receipt' as const, label: 'Cash Receipt',        icon: Landmark,     color: 'text-sky-600 bg-sky-50 hover:bg-sky-100 border-sky-200',                 desc: 'Cash in from any source'  },
  { id: 'cash-payment' as const, label: 'Cash Payment',        icon: CreditCard,   color: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200',     desc: 'Cash out to any payee'    },
];

function today() { return new Date().toISOString().slice(0, 10); }

export default function QuickEntry() {
  const [open, setOpen]       = useState(false);
  const [type, setType]       = useState<EntryType>(null);
  const [saving, setSaving]   = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Shared fields
  const [date, setDate]         = useState(today());
  const [description, setDesc]  = useState('');
  const [amount, setAmount]     = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  // Sale-specific
  const [customerName, setCustomerName] = useState('');
  const [vatAmount, setVatAmount]       = useState('0');

  // Expense-specific
  const [vendorName, setVendorName]           = useState('');
  const [expenseAccountId, setExpenseAccId]   = useState('');
  const [expenseVat, setExpenseVat]           = useState('0');

  // Cash receipt / payment
  const [contraAccountId, setContraAccId] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setType(null); resetFields(); return; }
    // Load expense/income accounts for dropdowns
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

  function resetFields() {
    setDate(today()); setDesc(''); setAmount(''); setPayMethod('cash');
    setCustomerName(''); setVatAmount('0');
    setVendorName(''); setExpenseAccId(''); setExpenseVat('0');
    setContraAccId('');
  }

  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');
  const contraAccounts  = accounts.filter(a => ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].includes(a.accountType));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let url = ''; let body: any = {};

      if (type === 'sale') {
        url = '/api/finance/sales-book/record';
        body = { date, description, amount: Number(amount), vatAmount: Number(vatAmount), paymentMethod: payMethod, customerName };
      } else if (type === 'expense') {
        url = '/api/finance/purchase-book/record';
        body = { date, description, amount: Number(amount), vatAmount: Number(expenseVat), paymentMethod: payMethod, vendorName, expenseAccountId };
      } else if (type === 'cash-receipt') {
        url = '/api/finance/cash-book/record';
        body = { type: 'RECEIPT', date, description, amount: Number(amount), contraAccountId };
      } else if (type === 'cash-payment') {
        url = '/api/finance/cash-book/record';
        body = { type: 'PAYMENT', date, description, amount: Number(amount), contraAccountId };
      }

      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to record transaction'); return; }
      toast.success('Transaction recorded successfully');
      setOpen(false);
    } finally { setSaving(false); }
  }

  const selectedType = ENTRY_TYPES.find(t => t.id === type);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Quick Entry (new transaction)"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Overlay */}
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
                <h2 className="font-semibold text-base">
                  {type ? selectedType?.label : 'Quick Entry'}
                </h2>
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
                    <button
                      key={et.id}
                      onClick={() => setType(et.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${et.color}`}
                    >
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
                      type === 'sale' ? 'e.g. Sale of goods to ABC Ltd' :
                      type === 'expense' ? 'e.g. Office supplies purchase' :
                      type === 'cash-receipt' ? 'e.g. Cash received from customer' :
                      'e.g. Payment for utilities'
                    } value={description} onChange={e => setDesc(e.target.value)} />
                  </div>

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
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit">On Credit (AR)</SelectItem>
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
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit">On Credit (AP)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Cash receipt / payment fields */}
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
                        {type === 'cash-receipt' ? 'Account being credited (source of cash)' : 'Account being debited (use of cash)'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setType(null)}>Back</Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving ? 'Posting…' : 'Post Transaction'}
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
