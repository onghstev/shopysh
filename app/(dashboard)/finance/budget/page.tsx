'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw, BarChart3, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtShort = (n: number) => new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function pct(actual: number, budgeted: number) {
  if (!budgeted) return 0;
  return Math.round((actual / budgeted) * 100);
}

function ProgressBar({ actual, budgeted }: { actual: number; budgeted: number }) {
  const p = Math.min(200, pct(actual, budgeted));
  const over = actual > budgeted;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : p > 80 ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${Math.min(100, p)}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${over ? 'text-red-600' : ''}`}>{p}%</span>
    </div>
  );
}

export default function BudgetPage() {
  const [data, setData]             = useState<any>({ budgets: [], fiscalYears: [], currentFyId: '' });
  const [loading, setLoading]       = useState(true);
  const [selectedFyId, setSelFyId]  = useState('');
  const [expandedBudget, setExpanded] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [accounts, setAccounts]     = useState<any[]>([]);
  const [bName, setBName]           = useState('');
  const [bDesc, setBDesc]           = useState('');
  const [bLines, setBLines]         = useState<{ accountId: string; budgeted: string }[]>([{ accountId: '', budgeted: '' }]);
  const [creating, setCreating]     = useState(false);

  const load = useCallback(async (fyId?: string) => {
    setLoading(true);
    try {
      const qs = fyId ? `?fiscalYearId=${fyId}` : '';
      const res = await fetch(`/api/finance/budget${qs}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (!fyId && d.currentFyId) setSelFyId(d.currentFyId);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAccounts = async () => {
    const res = await fetch('/api/finance/accounts?pageSize=300');
    if (res.ok) { const d = await res.json(); setAccounts(d.accounts ?? []); }
  };

  const openCreate = () => {
    setBName(''); setBDesc('');
    setBLines([{ accountId: '', budgeted: '' }]);
    loadAccounts();
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = bLines.filter(l => l.accountId && l.budgeted);
    if (!validLines.length) { toast.error('Add at least one budget line'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/finance/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bName, description: bDesc, fiscalYearId: selectedFyId || undefined,
          lines: validLines.map(l => ({ accountId: l.accountId, budgeted: Number(l.budgeted), periodNumber: 0 })),
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Failed to create budget'); return; }
      toast.success('Budget created');
      setCreateOpen(false);
      load(selectedFyId || undefined);
    } finally { setCreating(false); }
  };

  const budgets: any[] = data.budgets ?? [];
  const fiscalYears: any[] = data.fiscalYears ?? [];

  const totalBudgeted = budgets.reduce((s: number, b: any) => s + (b.totalBudgeted ?? 0), 0);
  const totalActual   = budgets.reduce((s: number, b: any) => s + (b.totalActual  ?? 0), 0);

  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE' || a.accountType === 'INCOME');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Budget vs Actuals</h1>
          <p className="text-muted-foreground text-sm mt-1">Set spending targets and track real performance against plan</p>
        </div>
        <div className="flex gap-2">
          {fiscalYears.length > 0 && (
            <Select value={selectedFyId} onValueChange={v => { setSelFyId(v); load(v); }}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Fiscal Year" /></SelectTrigger>
              <SelectContent>
                {fiscalYears.map((fy: any) => (
                  <SelectItem key={fy.id} value={fy.id}>{fy.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => load(selectedFyId || undefined)} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> New Budget
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground font-medium mb-1">Total Budgeted</p>
              <p className="text-2xl font-bold">₦{fmtShort(totalBudgeted)}</p>
              <p className="text-xs text-muted-foreground mt-1">{budgets.length} budget{budgets.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground font-medium mb-1">Actual Spend (YTD)</p>
              <p className="text-2xl font-bold">₦{fmtShort(totalActual)}</p>
              <p className={`text-xs mt-1 font-medium ${totalActual > totalBudgeted ? 'text-red-600' : 'text-emerald-600'}`}>
                {totalActual > totalBudgeted ? `₦${fmtShort(totalActual - totalBudgeted)} over budget` : `₦${fmtShort(totalBudgeted - totalActual)} remaining`}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground font-medium mb-1">Budget Utilisation</p>
              <p className="text-2xl font-bold">{pct(totalActual, totalBudgeted)}%</p>
              <div className="mt-2">
                <ProgressBar actual={totalActual} budgeted={totalBudgeted} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground rounded-2xl border border-dashed">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No budgets yet</p>
          <p className="text-sm mt-1">Create a budget to start tracking spending against targets</p>
          <Button className="mt-4 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create First Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b: any) => {
            const isExpanded = expandedBudget === b.id;
            const over = b.totalActual > b.totalBudgeted;
            return (
              <div key={b.id} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                {/* Budget header row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : b.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{b.name}</p>
                      {b.description && <span className="text-xs text-muted-foreground">· {b.description}</span>}
                    </div>
                    <ProgressBar actual={b.totalActual} budgeted={b.totalBudgeted} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">₦{fmt(b.totalActual)}</p>
                    <p className="text-xs text-muted-foreground">of ₦{fmt(b.totalBudgeted)}</p>
                    {over && <p className="text-xs text-red-600 font-medium">₦{fmt(b.totalActual - b.totalBudgeted)} over</p>}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Line items */}
                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Account</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground">Budgeted</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground">Actual (YTD)</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground">Variance</th>
                          <th className="px-5 py-2.5 w-40 text-xs font-semibold text-muted-foreground">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(b.linesByAccount ?? []).map((line: any) => {
                          const variance = line.budgeted - line.actual;
                          const lineOver = line.actual > line.budgeted;
                          return (
                            <tr key={line.account.id} className="hover:bg-muted/10">
                              <td className="px-5 py-2.5">
                                <p className="font-medium text-sm">{line.account.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{line.account.code}</p>
                              </td>
                              <td className="px-5 py-2.5 text-right font-medium">₦{fmt(line.budgeted)}</td>
                              <td className="px-5 py-2.5 text-right">₦{fmt(line.actual)}</td>
                              <td className={`px-5 py-2.5 text-right font-semibold text-sm ${lineOver ? 'text-red-600' : 'text-emerald-600'}`}>
                                {lineOver ? '-' : '+'}₦{fmt(Math.abs(variance))}
                              </td>
                              <td className="px-5 py-2.5">
                                <ProgressBar actual={line.actual} budgeted={line.budgeted} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t bg-muted/30">
                        <tr>
                          <td className="px-5 py-2.5 font-bold text-sm">Total</td>
                          <td className="px-5 py-2.5 text-right font-bold">₦{fmt(b.totalBudgeted)}</td>
                          <td className="px-5 py-2.5 text-right font-bold">₦{fmt(b.totalActual)}</td>
                          <td className={`px-5 py-2.5 text-right font-bold ${over ? 'text-red-600' : 'text-emerald-600'}`}>
                            {over ? '-' : '+'}₦{fmt(Math.abs(b.totalBudgeted - b.totalActual))}
                          </td>
                          <td className="px-5 py-2.5">
                            <ProgressBar actual={b.totalActual} budgeted={b.totalBudgeted} />
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Budget Name *</Label>
              <Input required placeholder="e.g. FY 2026 Operating Budget" value={bName} onChange={e => setBName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input placeholder="e.g. Annual operating expenses" value={bDesc} onChange={e => setBDesc(e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Budget Lines *</Label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => setBLines(p => [...p, { accountId: '', budgeted: '' }])}>
                  <Plus className="w-3 h-3" /> Add Line
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Select value={line.accountId} onValueChange={v => setBLines(p => p.map((l, i) => i === idx ? { ...l, accountId: v } : l))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>
                          {expenseAccounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="w-32 h-9"
                      type="number" min="0" step="0.01" placeholder="Amount"
                      value={line.budgeted}
                      onChange={e => setBLines(p => p.map((l, i) => i === idx ? { ...l, budgeted: e.target.value } : l))}
                    />
                    {bLines.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        onClick={() => setBLines(p => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total budgeted: ₦{fmt(bLines.reduce((s, l) => s + (Number(l.budgeted) || 0), 0))}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
