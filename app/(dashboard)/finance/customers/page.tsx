'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Users, Plus, X, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';

const fmt = (n: number | string) =>
  Number(n).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 });

function AddCustomerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Customer added');
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm my-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Add Customer</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234…" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional" className="h-9 rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Add Customer'}</Button>
        </div>
      </div>
    </div>
  );
}

export default function FinanceCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
      if (!res.ok) { const d = await res.json(); alert(d.error); return; }
      const data = await res.json();
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const searchRef = useState<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
            Finance Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Shared with ecommerce — all tenant customers in one view
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="h-9 rounded-xl pl-9"
        />
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-border/50 p-4 shadow-sm inline-flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Customers</p>
          <p className="text-xl font-bold" style={{ color: 'hsl(168 84% 26%)' }}>{total}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">AR Balance</p>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance/receivables" className="underline underline-offset-2 hover:text-foreground transition-colors">
              View Receivables →
            </Link>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Phone</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Email</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Orders</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Lifetime Value</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">AR Balance</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search ? 'No customers match your search' : 'No customers yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        {c.name || <span className="text-muted-foreground italic">—</span>}
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{c.phone}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{c.email || '—'}</td>
                    <td className="py-3 px-4 text-right text-sm">{c.totalOrders ?? 0}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {fmt(c.lifetimeValue ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <Link
                        href="/finance/receivables"
                        className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        View details
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('en-NG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} customers</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
