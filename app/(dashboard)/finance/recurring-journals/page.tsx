'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Play, Pause, Trash2, RefreshCw, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface RJLine {
  id?: string;
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description: string;
}

interface RecurringJournal {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  dayOfMonth?: number;
  entryType: string;
  currency: string;
  isActive: boolean;
  nextRunDate: string;
  lastRunDate?: string;
  endDate?: string;
  runCount: number;
  lines: RJLine[];
}

interface GlAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function RecurringJournalsPage() {
  const [journals, setJournals] = useState<RecurringJournal[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    frequency: 'monthly',
    dayOfMonth: '1',
    currency: 'NGN',
    nextRunDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    lines: [
      { accountId: '', debit: '', credit: '', description: '' },
      { accountId: '', debit: '', credit: '', description: '' },
    ] as any[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([
        fetch('/api/finance/recurring-journals'),
        fetch('/api/finance/accounts?pageSize=200'),
      ]);
      const jData = await jRes.json();
      const aData = await aRes.json();
      setJournals(Array.isArray(jData) ? jData : []);
      setAccounts(Array.isArray(aData.accounts) ? aData.accounts : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    const lines = form.lines.filter(l => l.accountId);
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    if (lines.length < 2) { toast({ title: 'At least 2 lines required', variant: 'destructive' }); return; }

    const totalD = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const totalC = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalD - totalC) > 0.01) {
      toast({ title: 'Journal must balance', description: `Debit ${fmt(totalD)} ≠ Credit ${fmt(totalC)}`, variant: 'destructive' });
      return;
    }

    const res = await fetch('/api/finance/recurring-journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : null,
        endDate: form.endDate || null,
        lines: lines.map((l: any) => ({
          accountId:   l.accountId,
          debit:       Number(l.debit || 0),
          credit:      Number(l.credit || 0),
          description: l.description,
        })),
      }),
    });

    if (res.ok) {
      toast({ title: 'Recurring journal created' });
      setShowCreate(false);
      setForm({
        name: '', description: '', frequency: 'monthly', dayOfMonth: '1',
        currency: 'NGN', nextRunDate: new Date().toISOString().slice(0, 10), endDate: '',
        lines: [
          { accountId: '', debit: '', credit: '', description: '' },
          { accountId: '', debit: '', credit: '', description: '' },
        ],
      });
      load();
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error, variant: 'destructive' });
    }
  }

  async function handleRun(id: string) {
    setRunningId(id);
    const res = await fetch(`/api/finance/recurring-journals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run' }),
    });
    setRunningId(null);
    if (res.ok) {
      const data = await res.json();
      toast({ title: 'Journal posted', description: `Next run: ${fmtDate(data.nextRunDate)}` });
      load();
    } else {
      const err = await res.json();
      toast({ title: 'Error', description: err.error, variant: 'destructive' });
    }
  }

  async function handleToggle(j: RecurringJournal) {
    await fetch(`/api/finance/recurring-journals/${j.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recurring journal?')) return;
    await fetch(`/api/finance/recurring-journals/${id}`, { method: 'DELETE' });
    load();
  }

  function addLine() {
    setForm(f => ({ ...f, lines: [...f.lines, { accountId: '', debit: '', credit: '', description: '' }] }));
  }

  function removeLine(i: number) {
    setForm(f => ({ ...f, lines: f.lines.filter((_: any, idx: number) => idx !== i) }));
  }

  function setLine(i: number, field: string, value: string) {
    setForm(f => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: value };
      return { ...f, lines };
    });
  }

  const totalD = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalC = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

  const active = journals.filter(j => j.isActive);
  const overdue = journals.filter(j => j.isActive && new Date(j.nextRunDate) <= new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Journals</h1>
          <p className="text-muted-foreground text-sm">Automate repetitive journal entries — rent, depreciation, subscriptions</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Recurring Journal
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Schedules</p>
            <p className="text-3xl font-bold text-primary">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Due / Overdue</p>
            <p className={`text-3xl font-bold ${overdue.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{overdue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Schedules</p>
            <p className="text-3xl font-bold">{journals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Journal list */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading…</p>
      ) : journals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No recurring journals yet</p>
            <p className="text-sm text-muted-foreground">Set up automated entries for rent, depreciation, loan repayments, and more</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {journals.map(j => {
            const isOverdue = j.isActive && new Date(j.nextRunDate) <= new Date();
            const totalAmt = j.lines.reduce((s, l) => s + Number(l.debit), 0);
            return (
              <Card key={j.id} className={`${!j.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{j.name}</h3>
                        <Badge variant={j.isActive ? 'default' : 'secondary'}>
                          {j.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="outline">{FREQ_LABELS[j.frequency] ?? j.frequency}</Badge>
                        {isOverdue && <Badge className="bg-amber-500 text-white">Due Now</Badge>}
                      </div>
                      {j.description && <p className="text-sm text-muted-foreground mt-0.5">{j.description}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Next: <span className={isOverdue ? 'text-amber-600 font-medium' : ''}>{fmtDate(j.nextRunDate)}</span>
                        </span>
                        {j.lastRunDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Last run: {fmtDate(j.lastRunDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Runs: {j.runCount}
                        </span>
                        <span className="font-medium text-foreground">
                          ₦{fmt(totalAmt)} / {j.frequency}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={isOverdue ? 'default' : 'outline'}
                        onClick={() => handleRun(j.id)}
                        disabled={runningId === j.id}
                      >
                        {runningId === j.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />}
                        <span className="ml-1">Run Now</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleToggle(j)}>
                        {j.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span className="ml-1">{j.isActive ? 'Pause' : 'Resume'}</span>
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(j.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Lines preview */}
                  <div className="mt-3 border-t pt-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left font-medium pb-1">Account</th>
                          <th className="text-right font-medium pb-1 w-24">Debit</th>
                          <th className="text-right font-medium pb-1 w-24">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {j.lines.map((l, i) => {
                          const acc = accounts.find(a => a.id === l.accountId);
                          return (
                            <tr key={i}>
                              <td className="py-0.5">{acc ? `${acc.code} ${acc.name}` : l.accountId.slice(0, 8)}</td>
                              <td className="text-right py-0.5">{Number(l.debit) > 0 ? fmt(Number(l.debit)) : ''}</td>
                              <td className="text-right py-0.5">{Number(l.credit) > 0 ? fmt(Number(l.credit)) : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Recurring Journal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly Rent, Loan Repayment" />
              </div>
              <div>
                <Label>Frequency *</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {['monthly', 'quarterly', 'yearly'].includes(form.frequency) && (
                <div>
                  <Label>Day of Month</Label>
                  <Input type="number" min="1" max="31" value={form.dayOfMonth}
                    onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>First Run Date *</Label>
                <Input type="date" value={form.nextRunDate}
                  onChange={e => setForm(f => ({ ...f, nextRunDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional note" />
              </div>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Journal Lines</Label>
                <Button size="sm" variant="outline" onClick={addLine}><Plus className="w-3 h-3 mr-1" /> Add Line</Button>
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Account</th>
                      <th className="text-right p-2 font-medium w-28">Debit</th>
                      <th className="text-right p-2 font-medium w-28">Credit</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">
                          <Select value={line.accountId} onValueChange={v => setLine(i, 'accountId', v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select account…" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-right text-xs" type="number" min="0" value={line.debit}
                            onChange={e => setLine(i, 'debit', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-right text-xs" type="number" min="0" value={line.credit}
                            onChange={e => setLine(i, 'credit', e.target.value)} />
                        </td>
                        <td className="p-1">
                          {form.lines.length > 2 && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeLine(i)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted border-t">
                    <tr>
                      <td className="p-2 text-xs font-medium">Totals</td>
                      <td className={`p-2 text-right text-xs font-mono font-semibold ${!balanced && totalD > 0 ? 'text-destructive' : ''}`}>
                        {fmt(totalD)}
                      </td>
                      <td className={`p-2 text-right text-xs font-mono font-semibold ${!balanced && totalC > 0 ? 'text-destructive' : ''}`}>
                        {fmt(totalC)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {totalD > 0 && !balanced && (
                <p className="text-xs text-destructive mt-1">
                  Journal is out of balance by ₦{fmt(Math.abs(totalD - totalC))}
                </p>
              )}
              {balanced && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Journal is balanced
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!balanced}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
