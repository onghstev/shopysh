'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Minus, RefreshCw, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface StatementLine {
  id: string;
  transactionDate: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;
  reference?: string;
  isMatched: boolean;
  isIgnored: boolean;
  matchedEntryId?: string;
}

interface Statement {
  id: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  status: string;
  importedAt: string;
  lines: StatementLine[];
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
}

const fmt = (n: number) => Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function parseCSV(text: string): any[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
  return lines.slice(1).map(row => {
    const cols = row.split(',');
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim().replace(/^"|"$/g, ''); });
    return obj;
  });
}

export default function BankReconciliationPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selected, setSelected] = useState<Statement | null>(null);
  const [glEntries, setGlEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchingLineId, setMatchingLineId] = useState<string | null>(null);
  const [matchEntry, setMatchEntry] = useState('');
  const [autoMatching, setAutoMatching] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [importForm, setImportForm] = useState({
    statementDate: new Date().toISOString().slice(0, 10),
    openingBalance: '',
    closingBalance: '',
    currency: 'NGN',
    lines: [] as any[],
    fileName: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/bank-reconciliation');
      const data = await res.json();
      setStatements(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load GL entries for matching
  useEffect(() => {
    if (!selected) return;
    fetch('/api/finance/journal-entries?status=POSTED&pageSize=200')
      .then(r => r.json())
      .then(d => setGlEntries(Array.isArray(d.entries) ? d.entries : []))
      .catch(() => {});
  }, [selected]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const lines = rows.map(r => ({
        date:        r.date || r.valuedate || r.transactiondate || '',
        description: r.description || r.narration || r.details || r.particulars || '',
        debit:       parseFloat(r.debit || r.withdrawal || '0') || 0,
        credit:      parseFloat(r.credit || r.deposit || '0') || 0,
        balance:     parseFloat(r.balance || r.runningbalance || '') || undefined,
        reference:   r.reference || r.ref || r.cheque || '',
      })).filter(l => l.date || l.description);
      setImportForm(f => ({ ...f, lines, fileName: file.name }));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!importForm.lines.length) {
      toast({ title: 'No transactions found in file', variant: 'destructive' }); return;
    }
    const res = await fetch('/api/finance/bank-reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementDate:  importForm.statementDate,
        openingBalance: Number(importForm.openingBalance || 0),
        closingBalance: Number(importForm.closingBalance || 0),
        currency:       importForm.currency,
        lines:          importForm.lines,
      }),
    });
    if (res.ok) {
      toast({ title: 'Statement imported', description: `${importForm.lines.length} transactions loaded` });
      setShowImport(false);
      setImportForm({ statementDate: new Date().toISOString().slice(0, 10), openingBalance: '', closingBalance: '', currency: 'NGN', lines: [], fileName: '' });
      load();
    } else {
      const err = await res.json();
      toast({ title: 'Import failed', description: err.error, variant: 'destructive' });
    }
  }

  async function handleMatch(statementId: string, lineId: string) {
    if (!matchEntry) return;
    const res = await fetch(`/api/finance/bank-reconciliation/${statementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId, action: 'match', matchedEntryId: matchEntry }),
    });
    if (res.ok) {
      setMatchingLineId(null);
      setMatchEntry('');
      load();
    }
  }

  async function handleUnmatch(statementId: string, lineId: string) {
    await fetch(`/api/finance/bank-reconciliation/${statementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId, action: 'unmatch' }),
    });
    load();
  }

  async function handleIgnore(statementId: string, lineId: string) {
    await fetch(`/api/finance/bank-reconciliation/${statementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineId, action: 'ignore' }),
    });
    load();
  }

  async function handleComplete(statementId: string) {
    await fetch(`/api/finance/bank-reconciliation/${statementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    toast({ title: 'Statement marked as reconciled' });
    load();
  }

  async function handleAutoMatch(statementId: string) {
    setAutoMatching(statementId);
    try {
      const res = await fetch('/api/finance/ai/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId }),
      });
      const data = await res.json();
      // Store suggestions keyed by lineId for manual matching UI
      const suggMap: Record<string, any[]> = {};
      for (const s of (data.suggestions ?? [])) {
        if (s.candidates?.length) suggMap[s.lineId] = s.candidates;
      }
      setSuggestions(prev => ({ ...prev, ...suggMap }));
      toast({ title: `AI matched ${data.autoMatched?.length ?? 0} transaction${data.autoMatched?.length !== 1 ? 's' : ''} automatically`, description: 'Remaining suggestions shown inline — review and confirm.' });
      load();
    } catch {
      toast({ title: 'Auto-match failed', variant: 'destructive' } as any);
    }
    setAutoMatching(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bank statement?')) return;
    await fetch(`/api/finance/bank-reconciliation/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
          <p className="text-muted-foreground text-sm">Upload bank statements and match them against your GL entries</p>
        </div>
        <Button onClick={() => setShowImport(true)}>
          <Upload className="w-4 h-4 mr-2" /> Import Statement
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading…</p>
      ) : statements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No bank statements imported yet</p>
            <p className="text-sm text-muted-foreground mt-1">Import a CSV from your bank to start reconciling</p>
            <Button className="mt-4" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import Statement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {statements.map(stmt => {
            const matched = stmt.lines.filter(l => l.isMatched).length;
            const ignored = stmt.lines.filter(l => l.isIgnored).length;
            const unmatched = stmt.lines.filter(l => !l.isMatched && !l.isIgnored).length;
            const pct = stmt.lines.length ? Math.round(((matched + ignored) / stmt.lines.length) * 100) : 0;
            const expanded = expandedId === stmt.id;

            return (
              <Card key={stmt.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="ghost" className="p-1 h-auto" onClick={() => setExpandedId(expanded ? null : stmt.id)}>
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <div>
                        <p className="font-semibold">{fmtDate(stmt.statementDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {stmt.lines.length} transactions · Imported {fmtDate(stmt.importedAt)}
                        </p>
                      </div>
                      <Badge variant={stmt.status === 'reconciled' ? 'default' : 'secondary'}>
                        {stmt.status === 'reconciled' ? 'Reconciled' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Closing Balance</p>
                        <p className="font-semibold">₦{fmt(stmt.closingBalance)}</p>
                      </div>
                      <div className="text-right text-sm min-w-[80px]">
                        <p className="text-muted-foreground">{pct}% matched</p>
                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                          <div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {stmt.status !== 'reconciled' && unmatched > 0 && (
                        <Button size="sm" variant="outline" onClick={() => handleAutoMatch(stmt.id)} disabled={autoMatching === stmt.id}>
                          {autoMatching === stmt.id
                            ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                          AI Match
                        </Button>
                      )}
                      {stmt.status !== 'reconciled' && unmatched === 0 && (
                        <Button size="sm" onClick={() => handleComplete(stmt.id)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(stmt.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Progress summary */}
                  <div className="flex gap-4 text-xs mt-2 pl-9">
                    <span className="text-green-600">✓ {matched} matched</span>
                    <span className="text-muted-foreground">— {ignored} ignored</span>
                    {unmatched > 0 && <span className="text-amber-600">⚠ {unmatched} unmatched</span>}
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0">
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 font-medium">Date</th>
                            <th className="text-left p-2 font-medium">Description</th>
                            <th className="text-right p-2 font-medium w-28">Debit</th>
                            <th className="text-right p-2 font-medium w-28">Credit</th>
                            <th className="text-left p-2 font-medium w-32">Status</th>
                            <th className="p-2 w-36">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stmt.lines.map(line => {
                            const matchedEntry = glEntries.find(e => e.id === line.matchedEntryId);
                            return (
                              <tr key={line.id} className={`border-t ${line.isIgnored ? 'opacity-40' : ''}`}>
                                <td className="p-2 text-xs">{fmtDate(line.transactionDate)}</td>
                                <td className="p-2">
                                  <p className="text-xs">{line.description}</p>
                                  {line.reference && <p className="text-xs text-muted-foreground">Ref: {line.reference}</p>}
                                  {matchedEntry && (
                                    <p className="text-xs text-green-600 mt-0.5">→ {matchedEntry.entryNumber}: {matchedEntry.description}</p>
                                  )}
                                </td>
                                <td className="p-2 text-right text-xs font-mono">{Number(line.debit) > 0 ? fmt(Number(line.debit)) : ''}</td>
                                <td className="p-2 text-right text-xs font-mono">{Number(line.credit) > 0 ? fmt(Number(line.credit)) : ''}</td>
                                <td className="p-2">
                                  {line.isMatched && <Badge className="bg-green-100 text-green-700 text-xs">Matched</Badge>}
                                  {line.isIgnored && <Badge variant="secondary" className="text-xs">Ignored</Badge>}
                                  {!line.isMatched && !line.isIgnored && <Badge variant="outline" className="text-xs text-amber-600">Unmatched</Badge>}
                                </td>
                                <td className="p-2">
                                  {matchingLineId === line.id ? (
                                    <div className="flex gap-1">
                                      <Select value={matchEntry} onValueChange={setMatchEntry}>
                                        <SelectTrigger className="h-7 text-xs w-40">
                                          <SelectValue placeholder="Pick entry…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {glEntries.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.entryNumber} – ₦{fmt(Number(e.totalDebit))}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button size="sm" className="h-7 px-2" onClick={() => handleMatch(stmt.id, line.id)}>✓</Button>
                                      <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => setMatchingLineId(null)}>✕</Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      {!line.isMatched && !line.isIgnored && (
                                        <>
                                          {suggestions[line.id]?.[0] && (
                                            <Button size="sm" className="h-7 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                              onClick={() => { setMatchingLineId(line.id); setMatchEntry(suggestions[line.id][0].entryId); }}
                                              title={`AI suggestion: ${suggestions[line.id][0].entryNumber} (${suggestions[line.id][0].score}% match)`}>
                                              <Sparkles className="w-3 h-3 mr-1" />{suggestions[line.id][0].score}%
                                            </Button>
                                          )}
                                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setMatchingLineId(line.id); setMatchEntry(suggestions[line.id]?.[0]?.entryId ?? ''); }}>
                                            Match
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleIgnore(stmt.id, line.id)}>
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                        </>
                                      )}
                                      {line.isMatched && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handleUnmatch(stmt.id, line.id)}>
                                          Unmatch
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Import dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Bank Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statement Date *</Label>
                <Input type="date" value={importForm.statementDate}
                  onChange={e => setImportForm(f => ({ ...f, statementDate: e.target.value }))} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={importForm.currency} onValueChange={v => setImportForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening Balance</Label>
                <Input type="number" value={importForm.openingBalance}
                  onChange={e => setImportForm(f => ({ ...f, openingBalance: e.target.value }))} />
              </div>
              <div>
                <Label>Closing Balance</Label>
                <Input type="number" value={importForm.closingBalance}
                  onChange={e => setImportForm(f => ({ ...f, closingBalance: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Bank Statement CSV *</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {importForm.fileName ? (
                  <div>
                    <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="font-medium">{importForm.fileName}</p>
                    <p className="text-sm text-muted-foreground">{importForm.lines.length} transactions found</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Click to upload CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columns: date, description, debit, credit, balance, reference
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            {importForm.lines.length > 0 && (
              <div className="border rounded-md overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-1.5 font-medium">Date</th>
                      <th className="text-left p-1.5 font-medium">Description</th>
                      <th className="text-right p-1.5 font-medium">Debit</th>
                      <th className="text-right p-1.5 font-medium">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importForm.lines.map((l, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1.5">{l.date}</td>
                        <td className="p-1.5 max-w-[150px] truncate">{l.description}</td>
                        <td className="p-1.5 text-right">{l.debit > 0 ? fmt(l.debit) : ''}</td>
                        <td className="p-1.5 text-right">{l.credit > 0 ? fmt(l.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importForm.lines.length}>
              Import {importForm.lines.length > 0 ? `${importForm.lines.length} Transactions` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
