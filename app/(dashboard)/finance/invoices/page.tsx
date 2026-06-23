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
import { FileText, Plus, Loader2, Trash2, CheckCircle2, Clock, AlertCircle, Eye, Send } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

interface InvoiceRecord {
  id: string; invoiceNumber: string; invoiceType: string; subtotal: string; taxAmount: string;
  discountAmount: string; totalAmount: string; status: string; dueDate: string | null;
  paidAt: string | null; notes: string | null; createdAt: string;
  customer?: { id: string; name: string | null; phone: string; email: string | null } | null;
}

interface Customer { id: string; name: string | null; phone: string; email: string | null; }

export default function InvoicesPage() {
  const { data: session } = useSession() || {};
  const currency = (session?.user as any)?.tenantCurrency ?? 'NGN';
  const currSymbol = currency === 'USD' ? '$' : '₦';
  const [items, setItems] = useState<InvoiceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const emptyForm = { customerId: '', invoiceType: 'standard', subtotal: '', taxAmount: '0', discountAmount: '0', totalAmount: '', dueDate: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?pageSize=200');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data.items || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/finance/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setPaidTotal(Number(data.paidTotal));
        setPendingTotal(Number(data.pendingTotal));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-calculate total
  useEffect(() => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.taxAmount) || 0;
    const disc = parseFloat(form.discountAmount) || 0;
    setForm(prev => ({ ...prev, totalAmount: String(sub + tax - disc) }));
  }, [form.subtotal, form.taxAmount, form.discountAmount]);

  const handleSubmit = async () => {
    if (!form.customerId || !form.subtotal) { toast.error('Select a customer and enter amount'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/finance/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success('Invoice created'); setShowAdd(false); setForm(emptyForm); fetchData(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success(`Invoice marked as ${status}`); fetchData(); setShowDetail(false); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try { await fetch(`/api/finance/invoices/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchData(); } catch { toast.error('Error'); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer invoices</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Paid</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(paidTotal, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-600" /></div>
          <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingTotal, currency)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Invoices</p><p className="text-xl font-bold">{total}</p></div>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <Card><CardContent className="p-4">
        <div className="flex gap-3 items-end">
          <div className="w-40">
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </CardContent></Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No invoices yet</p>
              <Button className="mt-4" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>Create First Invoice</Button>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => { setSelectedInvoice(inv); setShowDetail(true); }}>
                    <TableCell className="font-mono text-sm font-semibold">{inv.invoiceNumber}</TableCell>
                    <TableCell><p className="font-medium text-sm">{inv.customer?.name || inv.customer?.phone || '-'}</p>{inv.customer?.email && <p className="text-xs text-muted-foreground">{inv.customer.email}</p>}</TableCell>
                    <TableCell className="text-sm">{formatDate(inv.createdAt)}</TableCell>
                    <TableCell className="text-sm">{inv.dueDate ? formatDate(inv.dueDate) : '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className={INVOICE_STATUS_COLORS[inv.status] || ''}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(inv.totalAmount, currency)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {inv.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleStatusUpdate(inv.id, 'paid')} title="Mark Paid"><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Create Invoice */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Customer *</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name || c.phone}{c.email ? ` (${c.email})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Invoice Type</Label>
                <Select value={form.invoiceType} onValueChange={(v) => setForm({ ...form, invoiceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="proforma">Proforma</SelectItem><SelectItem value="receipt">Receipt</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Subtotal ({currSymbol}) *</Label><Input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Tax ({currSymbol})</Label><Input type="number" step="0.01" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Discount ({currSymbol})</Label><Input type="number" step="0.01" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} placeholder="0.00" /></div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-lg font-bold">{formatCurrency(form.totalAmount, currency)}</span>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes for the invoice" /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold">{selectedInvoice.invoiceNumber}</span>
                <Badge variant="secondary" className={INVOICE_STATUS_COLORS[selectedInvoice.status] || ''}>{selectedInvoice.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{selectedInvoice.customer?.name || selectedInvoice.customer?.phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(selectedInvoice.createdAt)}</span></div>
                {selectedInvoice.dueDate && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{formatDate(selectedInvoice.dueDate)}</span></div>}
                {selectedInvoice.paidAt && <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{formatDate(selectedInvoice.paidAt)}</span></div>}
                <hr className="my-2" />
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedInvoice.subtotal, currency)}</span></div>
                {Number(selectedInvoice.taxAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(selectedInvoice.taxAmount, currency)}</span></div>}
                {Number(selectedInvoice.discountAmount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(selectedInvoice.discountAmount, currency)}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(selectedInvoice.totalAmount, currency)}</span></div>
              </div>
              {selectedInvoice.notes && <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{selectedInvoice.notes}</p>}
              {selectedInvoice.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={() => handleStatusUpdate(selectedInvoice.id, 'paid')}><CheckCircle2 className="w-4 h-4" />Mark as Paid</Button>
                  <Button variant="destructive" className="gap-2" onClick={() => handleStatusUpdate(selectedInvoice.id, 'cancelled')}>Cancel</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
