'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Building2, X, Check, Trash2, Pencil, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', city: '', country: 'NG', taxId: '', bankName: '', bankAcctNo: '', paymentTerms: '30', creditLimit: '', notes: '' };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(search ? { search } : {}) });
      const res = await fetch(`/api/finance/vendors?${params}`);
      if (res.ok) { const d = await res.json(); setVendors(d.vendors); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (v: any) => {
    setEditTarget(v);
    setForm({ name: v.name, email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '', city: v.city ?? '', country: v.country ?? 'NG', taxId: v.taxId ?? '', bankName: v.bankName ?? '', bankAcctNo: v.bankAcctNo ?? '', paymentTerms: String(v.paymentTerms ?? 30), creditLimit: v.creditLimit ? String(v.creditLimit) : '', notes: v.notes ?? '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Vendor name is required'); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/finance/vendors/${editTarget.id}` : '/api/finance/vendors';
      const method = editTarget ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editTarget ? 'Vendor updated' : 'Vendor created');
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return;
    const res = await fetch(`/api/finance/vendors/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error((await res.json()).error); return; }
    toast.success('Vendor deleted');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Vendors & Suppliers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} active vendors</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Vendor</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input className="pl-8 h-9 rounded-xl" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card py-16 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No vendors yet</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={openCreate}>Add first vendor</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{v.name}</p>
                    {v.code && <p className="text-xs font-mono text-muted-foreground">{v.code}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)} className="p-1 rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
              <div className="space-y-1.5">
                {v.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{v.email}</div>}
                {v.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{v.phone}</div>}
                {v.city && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{v.city}, {v.country}</div>}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>Terms: {v.paymentTerms}d</span>
                <span>{v._count?.purchaseInvoices ?? 0} invoice{(v._count?.purchaseInvoices ?? 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg my-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editTarget ? 'Edit Vendor' : 'New Vendor'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vendor Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="h-9 rounded-xl" placeholder="Supplier Company Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax ID (TIN)</Label>
                  <Input value={form.taxId} onChange={e => setForm(p => ({...p, taxId: e.target.value}))} className="h-9 rounded-xl" placeholder="12345678-0001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank Name</Label>
                  <Input value={form.bankName} onChange={e => setForm(p => ({...p, bankName: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Number</Label>
                  <Input value={form.bankAcctNo} onChange={e => setForm(p => ({...p, bankAcctNo: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Terms (days)</Label>
                  <Input type="number" value={form.paymentTerms} onChange={e => setForm(p => ({...p, paymentTerms: e.target.value}))} className="h-9 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Credit Limit (₦)</Label>
                  <Input type="number" value={form.creditLimit} onChange={e => setForm(p => ({...p, creditLimit: e.target.value}))} className="h-9 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="h-9 rounded-xl" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><Check className="w-4 h-4 mr-1.5" />{editTarget ? 'Update' : 'Create'}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
