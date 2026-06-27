'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, BookOpen, RefreshCw, X, Trash2, Send, ChevronLeft, ChevronRight as ChevRight, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ENTRY_TYPES = [
  'GENERAL_JOURNAL','SALES_INVOICE','SALES_RECEIPT','SALES_RETURN','CREDIT_NOTE',
  'PURCHASE_INVOICE','PURCHASE_PAYMENT','CASH_RECEIPT','CASH_PAYMENT',
  'BANK_DEPOSIT','BANK_WITHDRAWAL','BANK_TRANSFER','EXPENSE_CLAIM',
  'OPENING_BALANCE','CLOSING_ENTRY',
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
  POSTED: 'bg-emerald-100 text-emerald-800',
  REVERSED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

interface JLine { id?: string; accountId: string; accountName?: string; debit: string; credit: string; description: string; }

const CSV_TEMPLATE = `date,description,account_code,debit,credit,reference\n2026-01-15,Sales to ABC Ltd,4100,0,50000,INV-001\n2026-01-15,Sales to ABC Ltd,1200,50000,0,INV-001\n`;

function ImportModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'journal-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      toast.info('Save your Excel file as CSV first, then import.');
      setRows([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const allLines = text.split('\n').map(r => r.trim()).filter(Boolean);
      if (allLines.length < 2) { toast.error('CSV must have a header row and at least one data row.'); return; }
      const header = allLines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      const parsed = allLines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        header.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
        return {
          date: obj['date'] ?? '',
          description: obj['description'] ?? '',
          accountCode: obj['account_code'] ?? '',
          debit: parseFloat(obj['debit']) || 0,
          credit: parseFloat(obj['credit']) || 0,
          reference: obj['reference'] ?? '',
        };
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!rows.length) { toast.error('No rows to import'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/finance/journal/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} journal entr${data.created === 1 ? 'y' : 'ies'} created`);
        onSaved();
      }
      if (data.errors?.length) toast.error(`${data.errors.length} error(s) — see details below`);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl my-6 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Import Journal CSV</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
          <p className="font-medium">CSV format: <span className="font-mono text-xs">date, description, account_code, debit, credit, reference</span></p>
          <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
            <li>Rows with the same date + description are grouped into one journal entry</li>
            <li>Each group must balance (sum debits = sum credits)</li>
            <li>Entries are created as <strong>DRAFT</strong> — post them from the journal list</li>
          </ul>
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-1">
            <Download className="w-3.5 h-3.5" /> Download template CSV
          </button>
        </div>

        {/* File input */}
        <div className="space-y-1.5">
          <Label className="text-xs">Select CSV file</Label>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="h-9 rounded-xl text-sm" />
          {fileName && (
            <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
          )}
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{rows.length} rows parsed — preview (first 5):</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Date', 'Description', 'Account Code', 'Debit', 'Credit', 'Reference'].map(h => (
                      <th key={h} className="text-left p-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2">{r.date}</td>
                      <td className="p-2 truncate max-w-[120px]">{r.description}</td>
                      <td className="p-2 font-mono">{r.accountCode}</td>
                      <td className="p-2 text-right">{r.debit > 0 ? r.debit.toFixed(2) : ''}</td>
                      <td className="p-2 text-right">{r.credit > 0 ? r.credit.toFixed(2) : ''}</td>
                      <td className="p-2">{r.reference}</td>
                    </tr>
                  ))}
                  {rows.length > 5 && (
                    <tr>
                      <td colSpan={6} className="p-2 text-center text-muted-foreground">
                        …and {rows.length - 5} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-xl bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium">{result.created} journal entr{result.created === 1 ? 'y' : 'ies'} created</p>
            {result.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive">{result.errors.length} error(s):</p>
                <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSubmit} disabled={submitting || rows.length === 0}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {submitting ? 'Importing…' : `Import ${rows.length > 0 ? rows.length + ' rows' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewJournalModal({ accounts, onClose, onSaved }: { accounts: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ entryDate: new Date().toISOString().slice(0,10), description: '', entryType: 'GENERAL_JOURNAL', reference: '', notes: '' });
  const [lines, setLines] = useState<JLine[]>([
    { accountId: '', debit: '', credit: '', description: '' },
    { accountId: '', debit: '', credit: '', description: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  const addLine = () => setLines(p => [...p, { accountId: '', debit: '', credit: '', description: '' }]);
  const removeLine = (i: number) => setLines(p => p.filter((_, j) => j !== i));
  const updLine = (i: number, k: keyof JLine, v: string) => setLines(p => p.map((l, j) => j === i ? { ...l, [k]: v } : l));

  const handleSave = async (post = false) => {
    if (!form.description || !form.entryDate) { toast.error('Date and description required'); return; }
    const filledLines = lines.filter(l => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (filledLines.length < 2) { toast.error('At least 2 lines required'); return; }
    if (!balanced) { toast.error(`Not balanced: DR ${fmt(totalDebit)} ≠ CR ${fmt(totalCredit)}`); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/finance/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lines: filledLines.map(l => ({ ...l, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 })) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      if (post) {
        const res2 = await fetch(`/api/finance/journal/${data.entry.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'post' }),
        });
        const d2 = await res2.json();
        if (!res2.ok) { toast.error(d2.error); return; }
        toast.success('Journal posted successfully');
      } else {
        toast.success('Journal saved as draft');
      }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-3xl my-6 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">New Journal Entry</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Description *</Label>
            <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="e.g. Monthly rent payment" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={form.entryDate} onChange={e => setForm(p => ({...p, entryDate: e.target.value}))} className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Entry Type</Label>
            <select value={form.entryType} onChange={e => setForm(p => ({...p, entryType: e.target.value}))}
              className="h-9 rounded-xl border border-input bg-background px-2 text-xs w-full">
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reference</Label>
            <Input value={form.reference} onChange={e => setForm(p => ({...p, reference: e.target.value}))} placeholder="e.g. INV-001" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5 col-span-3">
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Optional notes" className="h-9 rounded-xl" />
          </div>
        </div>

        {/* Journal Lines */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left p-2 font-semibold text-muted-foreground">Account</th>
                <th className="text-left p-2 font-semibold text-muted-foreground">Description</th>
                <th className="text-right p-2 font-semibold text-muted-foreground w-28">Debit (₦)</th>
                <th className="text-right p-2 font-semibold text-muted-foreground w-28">Credit (₦)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-1.5">
                    <select value={line.accountId} onChange={e => updLine(i, 'accountId', e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs w-full min-w-[160px]">
                      <option value="">— Select account —</option>
                      {accounts.filter(a => a.allowPosting).map((a: any) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input value={line.description} onChange={e => updLine(i, 'description', e.target.value)}
                      placeholder="Description" className="h-8 rounded-lg text-xs" />
                  </td>
                  <td className="p-1.5">
                    <Input type="number" value={line.debit} onChange={e => updLine(i, 'debit', e.target.value)}
                      placeholder="0.00" className="h-8 rounded-lg text-xs text-right" min="0" />
                  </td>
                  <td className="p-1.5">
                    <Input type="number" value={line.credit} onChange={e => updLine(i, 'credit', e.target.value)}
                      placeholder="0.00" className="h-8 rounded-lg text-xs text-right" min="0" />
                  </td>
                  <td className="p-1.5">
                    {lines.length > 2 && (
                      <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-destructive/10">
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/20">
                <td colSpan={2} className="p-2">
                  <button onClick={addLine} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add line
                  </button>
                </td>
                <td className="p-2 text-right font-bold font-mono text-sm">{fmt(totalDebit)}</td>
                <td className={`p-2 text-right font-bold font-mono text-sm ${!balanced && totalDebit > 0 ? 'text-destructive' : ''}`}>{fmt(totalCredit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {!balanced && totalDebit > 0 && (
          <p className="text-xs text-destructive font-medium">
            Not balanced — difference: {fmt(Math.abs(totalDebit - totalCredit))}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !balanced}>
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving || !balanced}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Posting…' : 'Post Journal'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(status ? { status } : {}), ...(search ? { search } : {}) });
      const [eRes, aRes] = await Promise.all([
        fetch(`/api/finance/journal?${params}`),
        fetch('/api/finance/accounts'),
      ]);
      if (eRes.ok) { const d = await eRes.json(); setEntries(d.entries); setTotal(d.total); }
      if (aRes.ok) setAccounts((await aRes.json()).accounts);
    } finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async (id: string) => {
    const res = await fetch(`/api/finance/journal/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'post' }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('Journal posted');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft entry?')) return;
    const res = await fetch(`/api/finance/journal/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error((await res.json()).error); return; }
    toast.success('Entry deleted');
    load();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {showNew && (
        <NewJournalModal accounts={accounts} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onSaved={() => { setShowImport(false); load(); }} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} total entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}><Upload className="w-3.5 h-3.5 mr-1.5" />Import CSV</Button>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />New Journal</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 rounded-xl" placeholder="Search journals…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['', 'DRAFT', 'POSTED', 'REVERSED'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Entry #', 'Date', 'Description', 'Type', 'Status', 'Debit', ''].map(h => (
                <th key={h} className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 ${h === 'Debit' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  {Array(7).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No journal entries found</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNew(true)}>Create first entry</Button>
                </td>
              </tr>
            ) : (
              entries.map(e => (
                <tr key={e.id} className="border-b border-border/40 hover:bg-accent/40 group transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-semibold text-primary">{e.entryNumber}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(e.entryDate).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium truncate max-w-xs">{e.description}</p>
                    {e.reference && <p className="text-xs text-muted-foreground">{e.reference}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground">{e.entryType.replace(/_/g,' ')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[e.status] ?? 'bg-muted text-muted-foreground'}`}>{e.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-semibold">{fmt(Number(e.totalDebit))}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.status === 'DRAFT' && (
                        <>
                          <button onClick={() => handlePost(e.id)} title="Post" className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {totalPages} · {total} entries</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
              <ChevRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
