'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Plus, Loader2, Trash2, Pencil, Calendar, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'POS', 'Mobile Money', 'Cheque', 'Online'];

interface ExpenseCategory { id: string; name: string; icon: string | null; color: string | null; }
interface ExpenseRecord {
  id: string; description: string; amount: string; paymentMethod: string | null;
  vendor: string | null; reference: string | null; date: string; notes: string | null;
  isRecurring: boolean; category?: ExpenseCategory | null;
}

export default function ExpensesPage() {
  const { data: session } = useSession() || {};
  const currency = session?.user?.tenantCurrency ?? 'NGN';
  const currSymbol = currency === 'USD' ? '$' : '₦';
  const [items, setItems] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);

  const emptyForm = { categoryId: '', description: '', amount: '', paymentMethod: '', vendor: '', reference: '', date: new Date().toISOString().slice(0, 10), notes: '', isRecurring: false };
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/expenses/categories');
      if (res.ok) setCategories(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filterCat) params.set('categoryId', filterCat);
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);
      const res = await fetch(`/api/finance/expenses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setTotalAmount(Number(data.totalAmount));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filterCat, filterFrom, filterTo]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.date) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success('Expense recorded'); setShowAdd(false); setForm(emptyForm); fetchData(); }
      else toast.error('Failed to save');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/finance/expenses/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success('Updated'); setShowEdit(false); fetchData(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchData(); } catch { toast.error('Error'); }
  };

  const openEdit = (item: ExpenseRecord) => {
    setEditId(item.id);
    setForm({ categoryId: item.category?.id || '', description: item.description, amount: String(item.amount), paymentMethod: item.paymentMethod || '', vendor: item.vendor || '', reference: item.reference || '', date: new Date(item.date).toISOString().slice(0, 10), notes: item.notes || '', isRecurring: item.isRecurring });
    setShowEdit(true);
  };

  const totalPages = Math.ceil(total / 20);

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Category</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
      </div>
      <div><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Office rent payment" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Amount ({currSymbol}) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></div>
        <div><Label>Payment Method</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Supplier/vendor name" /></div>
        <div><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Receipt number" /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded" />
        <Label htmlFor="recurring" className="text-sm cursor-pointer">This is a recurring expense</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track and categorize all business expenses</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="gap-2"><Plus className="w-4 h-4" /> Record Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-xl font-bold text-red-500">{formatCurrency(totalAmount, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Records</p><p className="text-xl font-bold">{total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"><Receipt className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-sm text-muted-foreground">Avg per Record</p><p className="text-xl font-bold">{total > 0 ? formatCurrency(totalAmount / total, currency) : `${currSymbol}0`}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <Label className="text-xs">Category</Label>
            <Select value={filterCat} onValueChange={(v) => { setFilterCat(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">From</Label><Input type="date" className="h-9 w-36" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} /></div>
          <div><Label className="text-xs">To</Label><Input type="date" className="h-9 w-36" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} /></div>
          {(filterCat || filterFrom || filterTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCat(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}>Clear</Button>
          )}
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <Button className="mt-4" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>Record First Expense</Button>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{item.description}</p>
                      {item.isRecurring && <Badge variant="outline" className="text-[10px] mt-0.5">Recurring</Badge>}
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="secondary" style={{ backgroundColor: item.category.color ? `${item.category.color}20` : undefined, color: item.category.color || undefined }}>{item.category.name}</Badge>
                      ) : <span className="text-sm text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.vendor || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.paymentMethod || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-red-500">{formatCurrency(item.amount, currency)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter><Button onClick={handleSubmit} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save Expense</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter><Button onClick={handleUpdate} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
