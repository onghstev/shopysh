'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, TrendingDown, Package, Loader2, MoreHorizontal,
  Calendar, MapPin, Hash, RefreshCw, Trash2, Eye, ChevronDown, Landmark,
  AlertTriangle, CheckCircle2, XCircle, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const CATEGORIES = [
  'Land & Buildings', 'Plant & Machinery', 'Motor Vehicles',
  'Furniture & Fittings', 'Computer Equipment', 'Office Equipment',
  'Tools & Equipment', 'Leasehold Improvements', 'Other',
];

const DEPRECIATION_METHODS = [
  { value: 'straight_line',    label: 'Straight Line' },
  { value: 'reducing_balance', label: 'Reducing Balance' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active:   { label: 'Active',   color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle2 },
  disposed: { label: 'Disposed', color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: XCircle },
  written_off: { label: 'Written Off', color: 'bg-red-100 text-red-700 border-red-200',  icon: AlertTriangle },
};

function pct(num: number, denom: number) {
  if (!denom) return 0;
  return Math.min(100, Math.round((num / denom) * 100));
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  name: '', description: '', category: '', purchaseDate: '', purchaseCost: '',
  residualValue: '0', usefulLifeYears: '', depreciationMethod: 'straight_line',
  location: '', serialNumber: '', currency: 'NGN',
};

export default function FixedAssetsPage() {
  const [assets, setAssets]           = useState<any[]>([]);
  const [summary, setSummary]         = useState<any>({});
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const pageSize = 20;

  const [addOpen, setAddOpen]         = useState(false);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailData, setDetailData]   = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [depreciateOpen, setDepreciateOpen] = useState(false);
  const [depreciateAsset, setDepreciateAsset] = useState<any>(null);
  const [depDate, setDepDate]         = useState('');
  const [depreciating, setDepreciating] = useState(false);

  const [disposeOpen, setDisposeOpen] = useState(false);
  const [disposeAsset, setDisposeAsset] = useState<any>(null);
  const [disposeForm, setDisposeForm] = useState({ disposalValue: '', disposedAt: '' });
  const [disposing, setDisposing]     = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter)   params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/finance/fixed-assets?${params}`);
      if (res.ok) {
        const d = await res.json();
        setAssets(d.items ?? []);
        setTotal(d.total ?? 0);
        setSummary(d.summary ?? {});
      }
    } finally { setLoading(false); }
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const openDetail = async (asset: any) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/finance/fixed-assets/${asset.id}`);
      if (res.ok) setDetailData(await res.json());
    } finally { setDetailLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/finance/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to add asset'); return; }
      toast.success(`Asset "${data.name}" added (${data.assetCode})`);
      setAddOpen(false);
      setForm({ ...EMPTY_FORM });
      fetchAssets();
    } finally { setSaving(false); }
  };

  const handleDepreciate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depreciateAsset) return;
    setDepreciating(true);
    try {
      const res = await fetch(`/api/finance/fixed-assets/${depreciateAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'depreciate', depreciationDate: depDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Depreciation failed'); return; }
      toast.success(`Depreciation posted: ${formatCurrency(data.amount, depreciateAsset.currency)} (Period ${data.periodNumber})`);
      setDepreciateOpen(false);
      fetchAssets();
    } finally { setDepreciating(false); }
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeAsset) return;
    setDisposing(true);
    try {
      const res = await fetch(`/api/finance/fixed-assets/${disposeAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispose', ...disposeForm }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Disposal failed'); return; }
      toast.success(`Asset "${disposeAsset.name}" disposed`);
      setDisposeOpen(false);
      fetchAssets();
    } finally { setDisposing(false); }
  };

  const handleDelete = async (asset: any) => {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/finance/fixed-assets/${asset.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Asset deleted'); fetchAssets(); }
    else toast.error('Failed to delete');
  };

  const filtered = search
    ? assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  const currency = filtered[0]?.currency || 'NGN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Fixed Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">Asset register, depreciation tracking and disposal management</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets',          value: summary.count ?? 0,                icon: Package,    format: 'count' },
          { label: 'Total Cost',             value: summary.totalCost ?? 0,            icon: Landmark,   format: 'currency' },
          { label: 'Accumulated Dep.',       value: summary.totalAccumDep ?? 0,        icon: TrendingDown, format: 'currency' },
          { label: 'Net Book Value',         value: summary.totalBookValue ?? 0,       icon: BarChart3,  format: 'currency' },
        ].map(({ label, value, icon: Icon, format }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-bold">
                {format === 'count' ? value : formatCurrency(value, currency)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input placeholder="Search assets…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
            <SelectItem value="written_off">Written Off</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No assets found</p>
              <p className="text-sm mt-1">Add your first fixed asset to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Asset</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Cost</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Accum. Dep.</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Book Value</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Dep. %</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((asset) => {
                    const depPct  = pct(Number(asset.accumulatedDepreciation), Number(asset.purchaseCost) - Number(asset.residualValue));
                    const stConf  = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.active;
                    const StIcon  = stConf.icon;
                    return (
                      <tr key={asset.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{asset.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{asset.assetCode}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{asset.category}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(asset.purchaseCost), asset.currency)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(Number(asset.accumulatedDepreciation), asset.currency)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(Number(asset.bookValue), asset.currency)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${depPct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{depPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${stConf.color}`}>
                            <StIcon className="w-3 h-3" />{stConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(asset)} title="View detail">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {asset.status === 'active' && (
                              <>
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Post depreciation"
                                  onClick={() => { setDepreciateAsset(asset); setDepDate(''); setDepreciateOpen(true); }}>
                                  <TrendingDown className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600" title="Dispose asset"
                                  onClick={() => { setDisposeAsset(asset); setDisposeForm({ disposalValue: '', disposedAt: '' }); setDisposeOpen(true); }}>
                                  <Package className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(asset)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Asset Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Fixed Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Asset Name *</Label>
                <Input required placeholder="e.g. Toyota Hilux 2022" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select required value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date *</Label>
                <Input required type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Cost *</Label>
                <Input required type="number" min="0" step="0.01" placeholder="0.00" value={form.purchaseCost} onChange={e => setForm(p => ({ ...p, purchaseCost: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Residual / Salvage Value</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.residualValue} onChange={e => setForm(p => ({ ...p, residualValue: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Useful Life (years) *</Label>
                <Input required type="number" min="1" max="50" placeholder="e.g. 5" value={form.usefulLifeYears} onChange={e => setForm(p => ({ ...p, usefulLifeYears: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Depreciation Method</Label>
                <Select value={form.depreciationMethod} onValueChange={v => setForm(p => ({ ...p, depreciationMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPRECIATION_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="GHS">GHS — Ghana Cedi</SelectItem>
                    <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location (optional)</Label>
                <Input placeholder="e.g. Head Office" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Serial / Reg. Number (optional)</Label>
                <Input placeholder="e.g. Lagos ABC-123KD" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea placeholder="Any additional notes…" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Asset Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : detailData && (
            <div className="space-y-5 pt-2">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Purchase Cost', value: formatCurrency(detailData.purchaseCost, detailData.currency) },
                  { label: 'Accumulated Dep.', value: formatCurrency(detailData.accumulatedDepreciation, detailData.currency) },
                  { label: 'Net Book Value', value: formatCurrency(detailData.bookValue, detailData.currency) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="font-bold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Asset Code',   detailData.assetCode],
                  ['Category',     detailData.category],
                  ['Purchase Date', formatDate(detailData.purchaseDate)],
                  ['Useful Life',  `${detailData.usefulLifeYears} years`],
                  ['Method',       DEPRECIATION_METHODS.find(m => m.value === detailData.depreciationMethod)?.label ?? detailData.depreciationMethod],
                  ['Residual Value', formatCurrency(detailData.residualValue, detailData.currency)],
                  ['Location',     detailData.location || '—'],
                  ['Serial No.',   detailData.serialNumber || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>

              {/* Depreciation schedule */}
              {detailData.depreciation?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Depreciation History ({detailData.depreciation.length} periods)</h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Period</th>
                          <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Date</th>
                          <th className="px-3 py-2 text-right text-muted-foreground font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailData.depreciation.map((d: any) => (
                          <tr key={d.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{d.periodNumber}</td>
                            <td className="px-3 py-2 text-muted-foreground">{formatDate(d.depreciationDate)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(d.amount, detailData.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Depreciate Dialog ── */}
      <Dialog open={depreciateOpen} onOpenChange={setDepreciateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Post Depreciation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDepreciate} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Post one period of depreciation for <strong>{depreciateAsset?.name}</strong>.
              The amount will be calculated automatically based on the depreciation method.
            </p>
            <div className="space-y-1.5">
              <Label>Depreciation Date</Label>
              <Input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} placeholder={new Date().toISOString().slice(0, 10)} />
              <p className="text-xs text-muted-foreground">Leave blank to use today's date</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDepreciateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={depreciating} className="gap-2">
                {depreciating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                Post Depreciation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dispose Dialog ── */}
      <Dialog open={disposeOpen} onOpenChange={setDisposeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dispose Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDispose} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Mark <strong>{disposeAsset?.name}</strong> as disposed. This cannot be undone.
            </p>
            <div className="space-y-1.5">
              <Label>Disposal Date</Label>
              <Input type="date" value={disposeForm.disposedAt} onChange={e => setDisposeForm(p => ({ ...p, disposedAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Proceeds / Disposal Value (optional)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={disposeForm.disposalValue} onChange={e => setDisposeForm(p => ({ ...p, disposalValue: e.target.value }))} />
              <p className="text-xs text-muted-foreground">How much was received on disposal (sale, scrap, etc.)</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisposeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={disposing} variant="destructive" className="gap-2">
                {disposing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Disposal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
