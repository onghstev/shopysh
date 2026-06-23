'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, Plus, Loader2, Trash2, Banknote, ArrowUpFromLine, ClipboardCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const ENTRY_TYPES = [
  { value: 'cash_sale', label: 'Cash Sale', icon: Banknote, color: 'text-emerald-600' },
  { value: 'bank_deposit', label: 'Bank Deposit', icon: ArrowUpFromLine, color: 'text-blue-600' },
  { value: 'withdrawal', label: 'Withdrawal', icon: ArrowUpFromLine, color: 'text-orange-600' },
  { value: 'reconciliation', label: 'Cash Reconciliation', icon: ClipboardCheck, color: 'text-purple-600' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  reconciled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

interface BankAccount { id: string; bankName: string; accountName: string; accountNumber: string; balance: string; isDefault: boolean; }
interface CashEntry {
  id: string; date: string; entryType: string; description: string; amount: string;
  openingBalance: string | null; closingBalance: string | null; expectedBalance: string | null;
  variance: string | null; reference: string | null; notes: string | null; status: string;
  bankAccount?: { id: string; bankName: string; accountNumber: string } | null;
}

export default function DailyBankingPage() {
  const { data: session } = useSession() || {};
  const currency = (session?.user as any)?.tenantCurrency ?? 'NGN';
  const currSymbol = currency === 'USD' ? '$' : '₦';
  const [items, setItems] = useState<CashEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [depositsTotal, setDepositsTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  const emptyForm = { entryType: 'cash_sale', description: '', amount: '', date: new Date().toISOString().slice(0, 10), bankAccountId: '', openingBalance: '', closingBalance: '', expectedBalance: '', reference: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const emptyBankForm = { bankName: '', accountName: '', accountNumber: '', accountType: 'current', balance: '', isDefault: false };
  const [bankForm, setBankForm] = useState(emptyBankForm);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/bank-accounts');
      if (res.ok) setAccounts(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (activeTab !== 'all') params.set('entryType', activeTab);
      const res = await fetch(`/api/finance/daily-banking?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setCashSalesTotal(Number(data.cashSalesTotal));
        setDepositsTotal(Number(data.depositsTotal));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, activeTab]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.date) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.bankAccountId) delete payload.bankAccountId;
      if (!payload.openingBalance) delete payload.openingBalance;
      if (!payload.closingBalance) delete payload.closingBalance;
      if (!payload.expectedBalance) delete payload.expectedBalance;
      const res = await fetch('/api/finance/daily-banking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success('Entry recorded'); setShowAdd(false); setForm(emptyForm); fetchData(); }
      else toast.error('Failed to save');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const handleAddBank = async () => {
    if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/bank-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bankForm) });
      if (res.ok) { toast.success('Bank account added'); setShowBank(false); setBankForm(emptyBankForm); fetchAccounts(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try { await fetch(`/api/finance/daily-banking/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchData(); } catch { toast.error('Error'); }
  };

  const handleReconcile = async (id: string) => {
    try {
      await fetch(`/api/finance/daily-banking/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'reconciled' }) });
      toast.success('Marked as reconciled');
      fetchData();
    } catch { toast.error('Error'); }
  };

  const totalPages = Math.ceil(total / 30);
  const isReconciliation = form.entryType === 'reconciliation';
  const isDeposit = form.entryType === 'bank_deposit';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Daily Banking</h1>
          <p className="text-muted-foreground mt-1">Cash sales, bank deposits & cash reconciliation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setBankForm(emptyBankForm); setShowBank(true); }}>Add Bank Account</Button>
          <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="gap-2"><Plus className="w-4 h-4" /> New Entry</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Banknote className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Cash Sales</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(cashSalesTotal, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><ArrowUpFromLine className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Bank Deposits</p><p className="text-xl font-bold text-blue-600">{formatCurrency(depositsTotal, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Landmark className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Bank Accounts</p><p className="text-xl font-bold">{accounts.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Bank Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Bank Accounts</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-3 rounded-xl border bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{acc.bankName}</p>
                    {acc.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{acc.accountName} • {acc.accountNumber}</p>
                  <p className="font-bold text-sm">{formatCurrency(acc.balance, currency)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setLoading(true); }}>
        <TabsList>
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="cash_sale">Cash Sales</TabsTrigger>
          <TabsTrigger value="bank_deposit">Deposits</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <Landmark className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No entries yet</p>
                  <Button className="mt-4" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>Add First Entry</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const typeInfo = ENTRY_TYPES.find(t => t.value === item.entryType);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {typeInfo && <typeInfo.icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />}
                              <span className="text-sm">{typeInfo?.label || item.entryType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{item.description}</p>
                            {item.variance && Number(item.variance) !== 0 && (
                              <p className={`text-xs flex items-center gap-1 ${Number(item.variance) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                <AlertTriangle className="w-3 h-3" /> Variance: {formatCurrency(item.variance, currency)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.bankAccount ? `${item.bankAccount.bankName} (...${item.bankAccount.accountNumber.slice(-4)})` : '-'}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.amount, currency)}</TableCell>
                          <TableCell><Badge variant="secondary" className={STATUS_COLORS[item.status] || ''}>{item.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.status === 'pending' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleReconcile(item.id)} title="Mark Reconciled"><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Banking Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Entry Type *</Label>
                <Select value={form.entryType} onValueChange={(v) => setForm({ ...form, entryType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Daily POS sales" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount ({currSymbol}) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
              {(isDeposit || isReconciliation) && accounts.length > 0 && (
                <div><Label>Bank Account</Label>
                  <Select value={form.bankAccountId} onValueChange={(v) => setForm({ ...form, bankAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bankName} (...{a.accountNumber.slice(-4)})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {isReconciliation && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Opening Balance</Label><Input type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} placeholder="0.00" /></div>
                <div><Label className="text-xs">Expected Balance</Label><Input type="number" step="0.01" value={form.expectedBalance} onChange={(e) => setForm({ ...form, expectedBalance: e.target.value })} placeholder="0.00" /></div>
                <div><Label className="text-xs">Closing Balance</Label><Input type="number" step="0.01" value={form.closingBalance} onChange={(e) => setForm({ ...form, closingBalance: e.target.value })} placeholder="0.00" /></div>
              </div>
            )}
            <div><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Teller/receipt number" /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={showBank} onOpenChange={setShowBank}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Bank Name *</Label><Input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. First Bank, GTBank" /></div>
            <div><Label>Account Name *</Label><Input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="Account holder name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Account Number *</Label><Input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="0123456789" /></div>
              <div><Label>Account Type</Label>
                <Select value={bankForm.accountType} onValueChange={(v) => setBankForm({ ...bankForm, accountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="current">Current</SelectItem><SelectItem value="savings">Savings</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Opening Balance ({currSymbol})</Label><Input type="number" step="0.01" value={bankForm.balance} onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })} placeholder="0.00" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="default-bank" checked={bankForm.isDefault} onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })} className="rounded" />
              <Label htmlFor="default-bank" className="text-sm cursor-pointer">Set as default account</Label>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddBank} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Add Account</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
