'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus, Search, Package, Boxes, TrendingDown, AlertTriangle,
  X, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronLeft, ChevronRight, History,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

// ─── Stock movement types ────────────────────────────────────────────────────
type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

const MOVEMENT_LABELS: Record<MovementType, string> = {
  IN:         'Stock In (Received)',
  OUT:        'Stock Out (Issued)',
  ADJUSTMENT: 'Adjust to Count',
};

const MOVEMENT_COLORS: Record<string, string> = {
  IN:         'bg-emerald-100 text-emerald-700',
  OUT:        'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  SALE:       'bg-amber-100 text-amber-700',
  RETURN:     'bg-purple-100 text-purple-700',
};

function stockBadge(qty: number, threshold: number) {
  if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (qty <= threshold) return <Badge className="bg-amber-100 text-amber-700 border-0">Low — {qty}</Badge>;
  return <Badge variant="secondary">{qty}</Badge>;
}

// ─── Adjust Stock Modal ──────────────────────────────────────────────────────
function AdjustStockModal({ product, onClose, onSaved }: {
  product: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const currentStock = product.stockQuantity ?? 0;
  const preview = (() => {
    const q = parseInt(quantity, 10);
    if (!q || q <= 0) return null;
    if (type === 'IN')   return currentStock + q;
    if (type === 'OUT')  return Math.max(0, currentStock - q);
    return q; // ADJUSTMENT = new balance
  })();

  const handleSubmit = async () => {
    const q = parseInt(quantity, 10);
    if (!q || q <= 0) { toast.error('Enter a positive quantity'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${product.id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity: q, reason: reason || undefined, reference: reference || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Stock updated → ${data.newStock} units`);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md my-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Adjust Stock</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{product.name} · Current: <strong>{currentStock}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Movement type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Movement Type *</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['IN', 'OUT', 'ADJUSTMENT'] as MovementType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 px-2 rounded-xl border text-xs font-medium transition-colors text-center ${
                  type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
                }`}
              >
                {t === 'IN' ? '↓ Stock In' : t === 'OUT' ? '↑ Stock Out' : '⟳ Adjust'}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {type === 'IN'  && 'Add received stock (purchase, return from customer, etc.)'}
            {type === 'OUT' && 'Remove stock (damage, write-off, internal use, etc.)'}
            {type === 'ADJUSTMENT' && 'Set stock to a specific count after a physical stocktake'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">
              {type === 'ADJUSTMENT' ? 'New Stock Count *' : 'Quantity *'}
            </Label>
            <Input
              type="number" min="0" value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={type === 'ADJUSTMENT' ? 'Enter actual count' : 'e.g. 50'}
              className="h-9 rounded-xl"
            />
            {preview !== null && (
              <p className="text-xs text-muted-foreground">
                New stock balance will be: <strong className={preview === 0 ? 'text-destructive' : preview <= (product.lowStockThreshold ?? 10) ? 'text-amber-600' : 'text-emerald-600'}>{preview}</strong>
              </p>
            )}
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Reason / Notes</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Purchased from supplier" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Reference (PO / GRN / etc.)</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. PO-2026-001" className="h-9 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Record Movement'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Movement History Modal ──────────────────────────────────────────────────
function MovementHistoryModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inventory/${productId}/movements`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 0 });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-base">Stock Movement History</h2>
            {data?.product && (
              <p className="text-xs text-muted-foreground mt-0.5">{data.product.name} {data.product.sku ? `· SKU: ${data.product.sku}` : ''} · Current stock: <strong>{data.product.stockQuantity}</strong></p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Loading…</p>
          ) : !data?.movements?.length ? (
            <div className="text-center py-12">
              <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No movements recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-right py-2 px-3">Qty</th>
                    <th className="text-right py-2 px-3">Balance</th>
                    <th className="text-left py-2 px-3">Reason</th>
                    <th className="text-left py-2 px-3">Reference</th>
                    <th className="text-left py-2 px-3">By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((m: any) => (
                    <tr key={m.id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString('en-NG')}
                        <span className="block text-[10px]">{new Date(m.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${MOVEMENT_COLORS[m.type] ?? 'bg-muted text-muted-foreground'}`}>{m.type}</span>
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-semibold ${m.quantity < 0 ? 'text-destructive' : m.type === 'OUT' ? 'text-destructive' : 'text-emerald-600'}`}>
                        {m.quantity >= 0 && m.type !== 'OUT' ? '+' : ''}{fmt(m.quantity)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(m.balanceAfter)}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs max-w-[140px] truncate">{m.reason ?? '—'}</td>
                      <td className="py-2 px-3 font-mono text-xs">{m.reference ?? '—'}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {m.createdBy ? `${m.createdBy.firstName ?? ''} ${m.createdBy.lastName ?? ''}`.trim() || m.createdBy.email : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────
function InventoryTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<any>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/inventory?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const products: any[] = data?.products ?? [];
  const summary = data?.summary ?? { lowStock: 0, outOfStock: 0 };
  const total   = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      {adjusting && (
        <AdjustStockModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => { setAdjusting(null); load(); }}
        />
      )}
      {viewing && (
        <MovementHistoryModal productId={viewing} onClose={() => setViewing(null)} />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/50 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Products</p>
          <p className="text-2xl font-bold">{loading ? '—' : total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-amber-700 font-medium">Low Stock</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{loading ? '—' : summary.lowStock}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <p className="text-xs text-red-700 font-medium">Out of Stock</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{loading ? '—' : summary.outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products…" className="pl-10 h-9 rounded-xl" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] rounded-xl"><SelectValue placeholder="All Stock" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">Stock</th>
                <th className="text-right py-3 px-4">Threshold</th>
                <th className="text-right py-3 px-4">Movements</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No products found</p>
                  </td>
                </tr>
              ) : products.map((p: any) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-accent/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <p className="font-medium">{p.name}</p>
                    {!p.isActive && <span className="text-[10px] text-muted-foreground">Inactive</span>}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{p.category?.name ?? '—'}</td>
                  <td className="py-2.5 px-4 text-right">
                    {stockBadge(p.stockQuantity, p.lowStockThreshold ?? 10)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground font-mono text-xs">{p.lowStockThreshold ?? 10}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground font-mono text-xs">{p._count?.stockMovements ?? 0}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                        onClick={() => setViewing(p.id)}>
                        <History className="w-3 h-3" /> History
                      </Button>
                      <Button size="sm" className="h-7 px-2 text-xs gap-1"
                        onClick={() => setAdjusting(p)}>
                        <RefreshCw className="w-3 h-3" /> Adjust
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} products</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products Tab (existing catalog list) ────────────────────────────────────
function ProductsTab() {
  const { data: session } = useSession() || {};
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);
      if (stockStatus && stockStatus !== 'all') params.set('stockStatus', stockStatus);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data?.products ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [page, search, categoryId, stockStatus]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories((await res.json())?.categories ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStock = params.get('stockStatus');
    if (urlStock) setStockStatus(urlStock);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Product deleted'); fetchProducts(); }
    else toast.error('Delete failed');
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-10" value={search}
              onChange={(e: any) => { setSearch(e?.target?.value ?? ''); setPage(1); }} />
          </div>
          <Select value={categoryId} onValueChange={(v: string) => { setCategoryId(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categories ?? []).map((parent: any) =>
                parent.children?.length > 0 ? (
                  <SelectGroup key={parent.id}>
                    <SelectLabel>{parent.name}</SelectLabel>
                    {parent.children.map((child: any) => (
                      <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <Select value={stockStatus} onValueChange={(v: string) => { setStockStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stock Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (products?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No products found</p>
            <Link href="/products/new"><Button className="mt-4"><Plus className="w-4 h-4 mr-2" /> Add Your First Product</Button></Link>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products ?? []).map((p: any) => (
                  <TableRow key={p?.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{p?.name ?? '-'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p?.description ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p?.sku ?? '-'}</TableCell>
                    <TableCell>{p?.category?.name ?? '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(p?.price, p?.currency ?? currency)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p?.stockQuantity <= (p?.lowStockThreshold ?? 10) ? 'destructive' : 'secondary'}>
                        {p?.stockQuantity ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/products/${p?.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(p?.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground self-center">Page {page}</span>
                <Button variant="outline" size="sm" disabled={products.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'inventory'>('products');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products & Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your product catalog and track stock movements</p>
        </div>
        {tab === 'products' && (
          <Link href="/products/new">
            <Button><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'products',  label: 'Product Catalog', icon: Package },
          { key: 'inventory', label: 'Stock Inventory',  icon: Boxes },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products'  && <ProductsTab />}
      {tab === 'inventory' && <InventoryTab />}
    </div>
  );
}
