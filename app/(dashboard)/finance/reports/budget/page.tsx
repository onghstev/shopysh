'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, PieChart, ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);

function VarianceBadge({ variance, budgeted }: { variance: number; budgeted: number }) {
  if (budgeted === 0) return null;
  const pct = Math.round((variance / budgeted) * 100);
  const over = variance > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${over ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {over ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {over ? '+' : ''}{pct}%
    </span>
  );
}

export default function BudgetReportPage() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [fiscalYearId, setFiscalYearId] = useState('');

  const load = useCallback(async (fyId?: string) => {
    setLoading(true);
    try {
      const params = fyId ? `?fiscalYearId=${fyId}` : '';
      const res = await fetch(`/api/finance/budget${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (!fyId && d.currentFyId) setFiscalYearId(d.currentFyId);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const budgets: any[] = data?.budgets ?? [];
  const fiscalYears: any[] = data?.fiscalYears ?? [];
  const currentFy = fiscalYears.find((f: any) => f.id === fiscalYearId);

  // Grand totals across all budgets
  const grandBudgeted = budgets.reduce((s, b) => s + b.totalBudgeted, 0);
  const grandActual   = budgets.reduce((s, b) => s + b.totalActual,   0);
  const grandVariance = grandActual - grandBudgeted;

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Budget vs Actuals</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />Print
        </Button>
      </div>

      {/* Fiscal year filter */}
      {fiscalYears.length > 0 && (
        <Card className="shadow-sm print:hidden">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground">Fiscal Year</label>
              <select
                className="h-9 border border-input rounded-lg text-sm px-3 bg-background"
                value={fiscalYearId}
                onChange={e => { setFiscalYearId(e.target.value); load(e.target.value); }}
              >
                {fiscalYears.map((fy: any) => (
                  <option key={fy.id} value={fy.id}>{fy.name}</option>
                ))}
              </select>
              <Badge variant={currentFy?.status === 'OPEN' ? 'default' : 'secondary'} className="text-xs">
                {currentFy?.status ?? ''}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <ReportPrintHeader title="Budget vs Actuals" subtitle={currentFy ? `${currentFy.name} — ${currentFy.startDate?.slice(0,10)} to ${currentFy.endDate?.slice(0,10)}` : undefined} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No budgets found for this fiscal year. Create a budget in Finance → Budget first.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 print:hidden">
            {[
              { label: 'Total Budgeted', value: fmt(grandBudgeted), color: '' },
              { label: 'Total Actual (YTD)', value: fmt(grandActual), color: '' },
              { label: 'Total Variance', value: `${grandVariance >= 0 ? '+' : ''}${fmt(grandVariance)}`, color: grandVariance > 0 ? 'text-red-600' : 'text-emerald-600' },
            ].map(c => (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {budgets.map((budget: any) => {
            const lines = budget.linesByAccount ?? [];
            return (
              <div key={budget.id} className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 bg-muted/20 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{budget.name}</p>
                    {budget.description && <p className="text-xs text-muted-foreground">{budget.description}</p>}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Budgeted: <span className="font-semibold text-foreground">{fmt(budget.totalBudgeted)}</span></p>
                    <p>Actual: <span className="font-semibold text-foreground">{fmt(budget.totalActual)}</span></p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border">
                        <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Account</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Budgeted</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Actual (YTD)</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Variance</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">% Used</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line: any) => {
                        const variance = line.actual - line.budgeted;
                        const pctUsed  = line.budgeted > 0 ? Math.round((line.actual / line.budgeted) * 100) : 0;
                        const over     = variance > 0;
                        return (
                          <tr key={line.account.id} className="border-b border-border/20 hover:bg-muted/10">
                            <td className="px-4 py-2">
                              <span className="font-mono text-muted-foreground mr-1.5">[{line.account.code}]</span>
                              {line.account.name}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(line.budgeted)}</td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(line.actual)}</td>
                            <td className={`px-4 py-2 text-right font-mono ${over ? 'text-red-600' : 'text-emerald-600'}`}>
                              {over ? '+' : ''}{fmt(variance)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pctUsed > 100 ? 'bg-red-500' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(pctUsed, 100)}%` }}
                                  />
                                </div>
                                <span className={pctUsed > 100 ? 'text-red-600 font-medium' : ''}>{pctUsed}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <VarianceBadge variance={variance} budgeted={line.budgeted} />
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/20 font-semibold border-t border-border">
                        <td className="px-4 py-2.5 text-right text-xs">Budget Total</td>
                        <td className="px-4 py-2.5 text-right font-mono">{fmt(budget.totalBudgeted)}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{fmt(budget.totalActual)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono ${budget.totalActual - budget.totalBudgeted > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {budget.totalActual - budget.totalBudgeted >= 0 ? '+' : ''}{fmt(budget.totalActual - budget.totalBudgeted)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand total */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4 min-w-72">
              <table className="text-sm text-right w-full">
                <tbody>
                  <tr><td className="pr-8 font-medium opacity-80">Grand Total Budgeted</td><td className="font-mono">{fmt(grandBudgeted)}</td></tr>
                  <tr><td className="pr-8 font-medium opacity-80">Grand Total Actual</td><td className="font-mono">{fmt(grandActual)}</td></tr>
                  <tr className="border-t border-white/20">
                    <td className="pr-8 font-bold pt-1">Net Variance</td>
                    <td className={`font-bold font-mono text-lg pt-1 ${grandVariance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                      {grandVariance >= 0 ? '+' : ''}{fmt(grandVariance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
