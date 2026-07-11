'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Package, ChevronLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);
}

export default function InventoryReportPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '500', trackStock: 'true' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { load(); }, []);

  const items: any[] = (data?.products ?? []).filter((p: any) =>
    !lowStockOnly || (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5)
  );

  // Summary
  const totalCostValue = items.reduce((s, p) => s + (Number(p.costPrice ?? 0) * (p.stockQuantity ?? 0)), 0);
  const totalSaleValue = items.reduce((s, p) => s + (Number(p.price ?? 0) * (p.stockQuantity ?? 0)), 0);
  const lowStockCount  = (data?.products ?? []).filter((p: any) => (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5)).length;

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const item of items) {
    const cat = item.category?.name ?? 'Uncategorised';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Inventory Report</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm print:hidden">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <Input className="h-9" placeholder="Product name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="w-44">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <Input className="h-9" placeholder="All categories" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer h-9 px-3 border border-input rounded-lg bg-background">
              <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="rounded" />
              Low stock only
            </label>
            <Button onClick={load} disabled={loading} className="h-9 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {[
            { label: 'Total SKUs', value: String(data.products?.length ?? 0) },
            { label: 'Low Stock', value: String(lowStockCount), alert: lowStockCount > 0 },
            { label: 'Cost Value', value: fmt(totalCostValue) },
            { label: 'Selling Value', value: fmt(totalSaleValue) },
          ].map(c => (
            <Card key={c.label} className={`shadow-sm ${c.alert ? 'border-orange-300' : ''}`}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {c.alert && <AlertTriangle className="w-3 h-3 text-orange-500" />}{c.label}
                </p>
                <p className={`text-xl font-bold mt-1 ${c.alert ? 'text-orange-600' : ''}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, products]) => {
            const catCost = products.reduce((s, p) => s + (Number(p.costPrice ?? 0) * (p.stockQuantity ?? 0)), 0);
            const catSale = products.reduce((s, p) => s + (Number(p.price ?? 0) * (p.stockQuantity ?? 0)), 0);
            return (
              <Card key={cat} className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-y border-border">
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">SKU</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Product</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Qty on Hand</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Low Stock</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Cost Price</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Selling Price</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Cost Value</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Sale Value</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p: any) => {
                          const qty = p.stockQuantity ?? 0;
                          const threshold = p.lowStockThreshold ?? 5;
                          const isLow = qty <= threshold;
                          const costVal = Number(p.costPrice ?? 0) * qty;
                          const saleVal = Number(p.price ?? 0) * qty;
                          return (
                            <tr key={p.id} className={`border-b border-border/30 ${isLow ? 'bg-orange-50/50' : 'hover:bg-muted/10'}`}>
                              <td className="px-4 py-2 font-mono text-muted-foreground">{p.sku || '—'}</td>
                              <td className="px-4 py-2 font-medium">{p.name}</td>
                              <td className={`px-4 py-2 text-right font-mono font-bold ${isLow ? 'text-orange-600' : ''}`}>{qty}</td>
                              <td className="px-4 py-2 text-right text-muted-foreground">{threshold}</td>
                              <td className="px-4 py-2 text-right font-mono">{fmt(Number(p.costPrice ?? 0))}</td>
                              <td className="px-4 py-2 text-right font-mono">{fmt(Number(p.price ?? 0))}</td>
                              <td className="px-4 py-2 text-right font-mono">{fmt(costVal)}</td>
                              <td className="px-4 py-2 text-right font-mono">{fmt(saleVal)}</td>
                              <td className="px-4 py-2">
                                {isLow ? (
                                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">Low</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">OK</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-muted/20 font-semibold border-t border-border">
                          <td colSpan={6} className="px-4 py-2 text-right text-xs">Subtotal — {cat}</td>
                          <td className="px-4 py-2 text-right font-mono">{fmt(catCost)}</td>
                          <td className="px-4 py-2 text-right font-mono">{fmt(catSale)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No products found.</div>
          )}

          {/* Grand total */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4">
                <table className="text-sm text-right">
                  <tbody>
                    <tr><td className="pr-8 font-medium opacity-80">Total Cost Value</td><td className="font-bold font-mono">{fmt(totalCostValue)}</td></tr>
                    <tr><td className="pr-8 font-medium opacity-80">Total Selling Value</td><td className="font-bold font-mono">{fmt(totalSaleValue)}</td></tr>
                    <tr className="border-t border-white/20">
                      <td className="pr-8 font-bold pt-1">Potential Gross Profit</td>
                      <td className="font-bold font-mono text-lg pt-1">{fmt(totalSaleValue - totalCostValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
