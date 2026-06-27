'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Plus, Loader2 } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const EMPTY_FORM = { name: '', phone: '', email: '', location: '', segment: 'New' };

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.set('search', search);
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data?.customers ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleAdd = async () => {
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Customer added');
        setShowAdd(false);
        setForm({ ...EMPTY_FORM });
        fetchCustomers();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to add customer');
      }
    } catch { toast.error('Failed to add customer'); }
    finally { setSaving(false); }
  };

  const segmentColor = (seg: string | null) => {
    if (seg === 'VIP') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    if (seg === 'Regular') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} customer{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by ID, name, phone, or email…" className="pl-10" value={search} onChange={(e: any) => { setSearch(e?.target?.value ?? ''); setPage(1); }} />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (customers?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No customers found</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Customer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Lifetime Value</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(customers ?? []).map((c: any) => (
                  <TableRow key={c?.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                    <TableCell>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c?.customerCode ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{c?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{c?.email ?? ''}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c?.phone ?? '-'}</TableCell>
                    <TableCell><Badge className={`text-xs ${segmentColor(c?.segment)}`}>{c?.segment ?? 'New'}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{c?.totalOrders ?? 0}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(c?.lifetimeValue, 'NGN')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(c?.lastInteractionAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page}</span>
              <Button variant="outline" size="sm" disabled={customers.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Name</Label>
              <Input id="cust-name" placeholder="Customer name" value={form.name} onChange={(e: any) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone *</Label>
              <Input id="cust-phone" placeholder="e.g. +2348012345678" value={form.phone} onChange={(e: any) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" placeholder="customer@email.com" value={form.email} onChange={(e: any) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-location">Location</Label>
              <Input id="cust-location" placeholder="City, State" value={form.location} onChange={(e: any) => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Segment</Label>
              <Select value={form.segment} onValueChange={(v: string) => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}