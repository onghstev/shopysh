'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingDown, Plus, Download, RefreshCw, Search, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtShort = (n: number) => new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function thisMonth() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

const EMPTY_FORM = {
  date:          new Date().toISOString().slice(0, 10),
  description:   '',
  amount:        '',
  categoryId:    '',
  vendor:        '',
  paymentMethod: 'cash',
  notes:         '',
  reference:     '',
};

export default function ExpensesPage() {
  const { from: defFrom, to: defTo } = thisMonth();
  const [from, setFrom]           = useState(defFrom);
  const [to, setTo]               = useState(defTo);
  const [items, setItems]         = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const [addOpen, setAddOpen]     = useState(false);
  const [editItem, setEditItem]   = useState<any>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        fetch(`/api/finance/expenses?from=${from}&to=${to}&pageSize=500`),
        fetch('/api/finance/expenses/categories'),
      ]);
      if (expRes.ok) {
        const d = await expRes.json();
        setItems(d.items ?? []);
        setTotalAmount(Number(d.totalAmount ?? 0));
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories ?? []);
      }
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setAddOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      date:          new Date(item.date).toISOString().slice(0, 10),
      description:   item.description ?? '',
      amount:        String(item.amount ?? ''),
      categoryId:    item.categoryId ?? '',
      vendor:        item.vendor ?? '',
      paymentMethod: item.paymentMethod ?? 'cash',
      notes:         item.notes ?? '',
      reference:     item.reference ?? '',
    });
    setAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount:     Number(form.amount),
        categoryId: form.categoryId || undefined,
      };
      const url = editItem
        ? `/api/finance/expenses/${editItem.id}`
        : '/api/finance/expenses';
      const res = await fetch(url, {
        method:  editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success(editItem ? 'Expense updated' : 'Expense recorded');
      setAddOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete "${item.description}"?`)) return;
    const res = await fetch(`/api/finance/expenses/${item.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); load(); }
    else toast.error('Failed to delete');
  };

  const exportCsv = () => {
    const rows = [
      ['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Payment Method', 'Notes'],
      ...filtered.map((e: any) => [
        new Date(e.date).toISOString().slice(0,10),
        `"${e.description ?? ''}"`,
        `"${e.category?.name ?? ''}"`,
        `"${e.vendor ?? ''}"`,
        Number(e.amount ?? 0).toFixed(2),
        e.paymentMethod ?? '',
        `"${e.notes ?? ''}"`,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `expenses-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = items.filter(e => {
    const matchSearch = !search || (e.description ?? '').toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || e.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  // Category breakdown
  const byCategory: Record<string, { name: string; color: string; total: number; count: number }> = {};
  for (const e of items) {
    const key  = e.categoryId ?? 'none';
    const name = e.category?.name ?? 'Uncategorised';
    const col  = e.category?.color ?? '#a1a1aa';
    if (!byCategory[key]) byCategory[key] = { name, color: col, total: 0, count: 0 };
    byCategory[key].total += Number(e.amount ?? 0);
    byCategory[key].count += 1;
  }
  const catBreakdown = Object.values(byCategory).sort((a, b) => b.total - a.total);
  const maxCat = catBreakdown[0]?.total ?? 1;

  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and categorise all business expenses</p>
        </div>
        <div className="flex gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          )}
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Record Expense
          </Button>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border bg-card shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-40 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-40 rounded-xl" />
        </div>
        <Button onClick={load} variant="outline" disabled={loading} className="gap-1.5 h-9">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        {['This Month', 'Last Month', 'This Year'].map(label => {
          const now = new Date();
          let f = '', t = '';
          if (label === 'This Month')  { f = defFrom; t = defTo; }
          else if (label === 'Last Month') {
            f = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
            t = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
          } else {
            f = `${now.getFullYear()}-01-01`;
            t = now.toISOString().slice(0, 10);
          }
          return (
            <Button key={label} size="sm" variant="ghost" className="text-xs h-9"
              onClick={() => { setFrom(f); setTo(t); }}>
              {label}
            </Button>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : (
          <>
            <Card className="shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Expenses</p>
                <p className="text-2xl font-bold">₦{fmtShort(totalAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">{items.length} transactions</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">Top Category</p>
                <p className="text-2xl font-bold truncate">{catBreakdown[0]?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {catBreakdown[0] ? `₦${fmtShort(catBreakdown[0].total)} · ${catBreakdown[0].count} entries` : 'No data'}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">Categories Used</p>
                <p className="text-2xl font-bold">{catBreakdown.length}</p>
                <p className="text-xs text-muted-foreground mt-1">of {categories.length} available</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Category breakdown */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">By Category</h2>
          {loading ? (
            <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : catBreakdown.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-dashed">No expenses in this period</div>
          ) : (
            <div className="space-y-3">
              {catBreakdown.map(({ name, color, total, count }) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[180px]">{name}</span>
                    <span className="text-muted-foreground ml-2 shrink-0">₦{fmt(total)} · {count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.round((total / maxCat) * 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions list */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-sm flex-1">Transactions</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <Input className="pl-8 h-8 w-44 text-xs" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-4 space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No expenses found</p>
                <p className="text-xs mt-1">Record your first expense or adjust the date range</p>
              </div>
            ) : (
              <>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/30 border-b z-10">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Description</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
                        <th className="px-4 py-2.5 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((e: any) => (
                        <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium truncate max-w-[180px]">{e.description}</p>
                            {e.vendor && <p className="text-xs text-muted-foreground">{e.vendor}</p>}
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {e.category ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: `${e.category.color}20`, color: e.category.color }}>
                                {e.category.name}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-700">₦{fmt(Number(e.amount))}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 items-center justify-end">
                              {e.glStatus && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                  e.glStatus === 'POSTED' ? 'bg-emerald-100 text-emerald-700'
                                  : e.glStatus === 'DRAFT' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-muted text-muted-foreground'
                                }`}>
                                  GL:{e.glStatus}
                                </span>
                              )}
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(e)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-700">₦{fmt(filteredTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input required placeholder="e.g. Office supplies, Electricity bill" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId || 'none'} onValueChange={v => setForm(p => ({ ...p, categoryId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vendor / Payee</Label>
                <Input placeholder="e.g. Shoprite" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="credit">On Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference / Receipt No.</Label>
              <Input placeholder="e.g. REC-001" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any additional notes…" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editItem ? 'Update' : 'Record Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
