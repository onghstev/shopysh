'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Landmark, ChevronLeft } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import { format } from 'date-fns';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);
}

export default function FixedAssetsRegisterPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState('active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '500' });
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/finance/fixed-assets?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const items: any[] = data?.items ?? [];
  const summary      = data?.summary ?? {};

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Fixed Assets Register</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            className="h-9 border border-input rounded-lg text-sm px-3 bg-background"
            value={status} onChange={e => setStatus(e.target.value)}
          >
            <option value="active">Active only</option>
            <option value="disposed">Disposed only</option>
            <option value="all">All assets</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>
      </div>

      <ReportPrintHeader title="Fixed Assets Register" subtitle={`As at ${format(new Date(), 'dd MMMM yyyy')}`} />

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {[
            { label: 'Total Cost', value: fmt(summary.totalCost ?? 0) },
            { label: 'Accum. Depreciation', value: fmt(summary.totalAccumDep ?? 0) },
            { label: 'Net Book Value', value: fmt(summary.totalBookValue ?? 0) },
            { label: 'Assets', value: String(summary.count ?? 0) },
          ].map(c => (
            <Card key={c.label} className="shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold mt-1">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, assets]) => {
            const catCost  = assets.reduce((s, a) => s + Number(a.purchaseCost), 0);
            const catAccum = assets.reduce((s, a) => s + Number(a.accumulatedDepreciation), 0);
            const catBV    = assets.reduce((s, a) => s + Number(a.bookValue), 0);
            return (
              <Card key={category} className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-y border-border">
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Code</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Asset Name</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Purchase Date</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Method</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Life (yrs)</th>
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Cost</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Accum. Dep.</th>
                          <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Book Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((a: any) => (
                          <tr key={a.id} className="border-b border-border/30 hover:bg-muted/10">
                            <td className="px-4 py-2 font-mono text-muted-foreground">{a.assetCode}</td>
                            <td className="px-4 py-2 font-medium">{a.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{format(new Date(a.purchaseDate), 'dd MMM yyyy')}</td>
                            <td className="px-4 py-2 text-muted-foreground capitalize">{a.depreciationMethod?.replace('_', ' ')}</td>
                            <td className="px-4 py-2 text-center text-muted-foreground">{a.usefulLifeYears}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className={`text-[10px] ${a.status === 'active' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-gray-500'}`}>
                                {a.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(Number(a.purchaseCost))}</td>
                            <td className="px-4 py-2 text-right font-mono text-muted-foreground">{fmt(Number(a.accumulatedDepreciation))}</td>
                            <td className="px-4 py-2 text-right font-mono font-semibold">{fmt(Number(a.bookValue))}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/20 font-semibold border-t border-border">
                          <td colSpan={6} className="px-4 py-2 text-right text-xs">Subtotal — {category}</td>
                          <td className="px-4 py-2 text-right font-mono">{fmt(catCost)}</td>
                          <td className="px-4 py-2 text-right font-mono text-muted-foreground">{fmt(catAccum)}</td>
                          <td className="px-4 py-2 text-right font-mono">{fmt(catBV)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No fixed assets found.</div>
          )}

          {/* Grand total */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4">
                <table className="text-sm text-right">
                  <tbody>
                    <tr>
                      <td className="pr-8 font-medium opacity-80">Total Cost</td>
                      <td className="font-bold font-mono">{fmt(summary.totalCost ?? 0)}</td>
                    </tr>
                    <tr>
                      <td className="pr-8 font-medium opacity-80">Accum. Depreciation</td>
                      <td className="font-bold font-mono">({fmt(summary.totalAccumDep ?? 0)})</td>
                    </tr>
                    <tr className="border-t border-white/20">
                      <td className="pr-8 font-bold pt-1">Net Book Value</td>
                      <td className="font-bold font-mono text-lg pt-1">{fmt(summary.totalBookValue ?? 0)}</td>
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
