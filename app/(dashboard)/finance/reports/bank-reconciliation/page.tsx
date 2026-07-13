'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, FileBarChart, ChevronLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { ReportPrintHeader } from '@/components/finance/report-print-header';
import { format } from 'date-fns';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n);

export default function BankReconciliationReportPage() {
  const [statements, setStatements] = useState<any[]>([]);
  const [selected, setSelected]     = useState<any>(null);
  const [loading, setLoading]       = useState(false);

  const loadStatements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/bank-reconciliation');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setStatements(list);
        if (list.length > 0) setSelected(list[0]);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatements(); }, []);

  const lines: any[] = selected?.lines ?? [];
  const matched   = lines.filter(l => l.isMatched);
  const unmatched = lines.filter(l => !l.isMatched && !l.isIgnored);
  const ignored   = lines.filter(l => l.isIgnored);

  const matchedDebits   = matched.filter(l => l.debit  > 0).reduce((s, l) => s + Number(l.debit),  0);
  const matchedCredits  = matched.filter(l => l.credit > 0).reduce((s, l) => s + Number(l.credit), 0);
  const unmatchedDebits = unmatched.filter(l => l.debit  > 0).reduce((s, l) => s + Number(l.debit),  0);
  const unmatchedCredits = unmatched.filter(l => l.credit > 0).reduce((s, l) => s + Number(l.credit), 0);

  function statusBadge(line: any) {
    if (line.isIgnored) return <Badge variant="secondary" className="text-[10px]">Ignored</Badge>;
    if (line.isMatched) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />Matched</Badge>;
    return <Badge variant="outline" className="text-orange-600 border-orange-200 text-[10px]"><XCircle className="w-2.5 h-2.5 mr-0.5" />Unmatched</Badge>;
  }

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/finance/reports">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Reports</Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Bank Reconciliation Report</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />Print
        </Button>
      </div>

      {/* Statement picker */}
      {statements.length > 0 && (
        <Card className="shadow-sm print:hidden">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground shrink-0">Statement</label>
              <select
                className="h-9 border border-input rounded-lg text-sm px-3 bg-background flex-1 max-w-xs"
                value={selected?.id ?? ''}
                onChange={e => setSelected(statements.find(s => s.id === e.target.value) ?? null)}
              >
                {statements.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {format(new Date(s.statementDate), 'dd MMM yyyy')} — {s.currency} {fmt(Number(s.closingBalance))}
                    {' '}({s.status})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : statements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No bank statements found. Import a statement in Finance → Bank Reconciliation first.
        </div>
      ) : selected && (
        <div className="space-y-4">
          <ReportPrintHeader title="Bank Reconciliation Statement" subtitle={`Statement Date: ${format(new Date(selected.statementDate), 'dd MMMM yyyy')}`} />

          {/* Reconciliation summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Opening Balance', value: fmt(Number(selected.openingBalance)), color: '' },
              { label: 'Closing Balance', value: fmt(Number(selected.closingBalance)), color: '' },
              { label: 'Matched Lines', value: String(matched.length), sub: `of ${lines.length}`, color: 'text-emerald-600' },
              { label: 'Unmatched Lines', value: String(unmatched.length), color: unmatched.length > 0 ? 'text-orange-600' : 'text-emerald-600' },
            ].map(c => (
              <Card key={c.label} className="shadow-sm">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                  {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reconciliation proof */}
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-3">Reconciliation Proof</p>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bank Statement</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-mono">{fmt(Number(selected.openingBalance))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">+ Total Debits (receipts)</span><span className="font-mono text-emerald-600">{fmt(lines.reduce((s,l) => s + Number(l.debit), 0))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">− Total Credits (payments)</span><span className="font-mono text-red-600">{fmt(lines.reduce((s,l) => s + Number(l.credit), 0))}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Closing Balance</span><span className="font-mono">{fmt(Number(selected.closingBalance))}</span></div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reconciliation Status</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Matched receipts</span><span className="font-mono text-emerald-600">{fmt(matchedDebits)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Matched payments</span><span className="font-mono text-red-600">{fmt(matchedCredits)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Unmatched receipts</span><span className="font-mono text-orange-600">{fmt(unmatchedDebits)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Unmatched payments</span><span className="font-mono text-orange-600">{fmt(unmatchedCredits)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="font-semibold">Status</span>
                    <Badge className={unmatched.length === 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                      {unmatched.length === 0 ? 'Fully Reconciled' : `${unmatched.length} item${unmatched.length !== 1 ? 's' : ''} unmatched`}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All statement lines */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
            <div className="px-5 py-3 bg-muted/20 border-b border-border">
              <p className="font-semibold text-sm">Statement Lines ({lines.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/10 border-b border-border">
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Reference</th>
                    <th className="text-right px-4 py-2 font-semibold text-emerald-700">Debit (DR)</th>
                    <th className="text-right px-4 py-2 font-semibold text-red-700">Credit (CR)</th>
                    <th className="text-center px-4 py-2 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l: any) => (
                    <tr key={l.id} className={`border-b border-border/20 ${l.isIgnored ? 'opacity-40' : ''} hover:bg-muted/10`}>
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.transactionDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-2 font-medium">{l.description}</td>
                      <td className="px-4 py-2 text-muted-foreground font-mono">{l.reference ?? '—'}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700">
                        {Number(l.debit) > 0 ? fmt(Number(l.debit)) : ''}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-red-700">
                        {Number(l.credit) > 0 ? fmt(Number(l.credit)) : ''}
                      </td>
                      <td className="px-4 py-2 text-center">{statusBadge(l)}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No lines in this statement.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unmatched items section */}
          {unmatched.length > 0 && (
            <Card className="shadow-sm border-orange-200">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Unmatched Items ({unmatched.length})
                </p>
                <p className="text-xs text-muted-foreground mb-3">These bank statement lines have not been matched to a GL journal entry. Investigate and match them in Finance → Bank Reconciliation.</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground">Description</th>
                      <th className="text-right py-1.5 font-semibold text-emerald-700">Debit</th>
                      <th className="text-right py-1.5 pl-4 font-semibold text-red-700">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((l: any) => (
                      <tr key={l.id} className="border-b border-border/20">
                        <td className="py-1.5 pr-4 text-muted-foreground">{format(new Date(l.transactionDate), 'dd MMM yyyy')}</td>
                        <td className="py-1.5 pr-4">{l.description}</td>
                        <td className="py-1.5 text-right font-mono text-emerald-700">{Number(l.debit) > 0 ? fmt(Number(l.debit)) : ''}</td>
                        <td className="py-1.5 pl-4 text-right font-mono text-red-700">{Number(l.credit) > 0 ? fmt(Number(l.credit)) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
