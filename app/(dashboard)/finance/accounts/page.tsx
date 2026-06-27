'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, ChevronRight, ChevronDown, Layers, Pencil, Trash2, X, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Template chooser modal ──────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'nigerian',
    name: 'Nigerian Standard',
    description: '65 accounts — full Nigerian SME chart of accounts with COGS, VAT, WHT, PAYE and multi-level structure.',
    accounts: 65,
    color: 'hsl(168 84% 26%)',
  },
  {
    id: 'simple',
    name: 'Simple Business',
    description: '25 accounts — lean setup for micro-businesses. Assets, liabilities, equity, revenue & expenses.',
    accounts: 25,
    color: 'hsl(40 78% 47%)',
  },
  {
    id: 'retail',
    name: 'Retail / Trading',
    description: '65 accounts — inventory-focused Nigerian CoA suitable for retail or trading businesses.',
    accounts: 65,
    color: '#7c3aed',
  },
];

function TemplateModal({ onClose, onSeeded }: { onClose: () => void; onSeeded: () => void }) {
  const [seeding, setSeeding] = useState<string | null>(null);

  const seed = async (templateId: string, replace = false) => {
    setSeeding(templateId);
    try {
      const res = await fetch('/api/finance/accounts/seed-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: templateId, replace }),
      });
      const data = await res.json();
      if (res.status === 409 && data.code === 'ACCOUNTS_EXIST') {
        setSeeding(null);
        const confirmed = window.confirm(
          `You already have ${data.count} account${data.count !== 1 ? 's' : ''} in your Chart of Accounts.\n\nApplying this template will DELETE all existing accounts and replace them with the template accounts.\n\nThis cannot be undone. Continue?`
        );
        if (confirmed) seed(templateId, true);
        return;
      }
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`${data.accountsCreated} accounts created from ${templateId} template`);
      onClose();
      onSeeded();
    } finally { setSeeding(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5" style={{ color: 'hsl(168 84% 26%)' }} />
              Choose a Chart of Accounts Template
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Select a starting point — you can add or edit accounts afterwards.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          {TEMPLATES.map(t => (
            <div key={t.id} className="border border-border/60 rounded-xl p-4 flex items-start gap-4 hover:border-primary/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                <p className="text-xs font-mono mt-1" style={{ color: t.color }}>{t.accounts} accounts</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => seed(t.id)}
                disabled={seeding !== null}
                className="shrink-0"
              >
                {seeding === t.id ? 'Seeding…' : 'Use This'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          This action seeds accounts once. If accounts already exist, the seed will be blocked.
        </p>
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-sky-100 text-sky-700',
  LIABILITY: 'bg-red-100 text-red-700',
  EQUITY: 'bg-violet-100 text-violet-700',
  INCOME: 'bg-emerald-100 text-emerald-700',
  EXPENSE: 'bg-amber-100 text-amber-700',
};

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

function AccountRow({ acct, depth, onEdit, onDelete }: {
  acct: any; depth: number; onEdit: (a: any) => void; onDelete: (a: any) => void;
}) {
  const balance = acct.balance ?? 0;
  const balColor = balance < 0 ? 'text-destructive' : balance > 0 ? 'text-foreground' : 'text-muted-foreground';

  return (
    <tr className="border-b border-border/40 hover:bg-accent/40 transition-colors group">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
          {depth > 0 && <span className="text-muted-foreground/40 text-xs">└</span>}
          <span className="font-mono text-sm font-semibold text-muted-foreground">{acct.code}</span>
        </div>
      </td>
      <td className="py-2.5 px-4">
        <span className={`text-sm ${!acct.allowPosting ? 'font-semibold' : ''}`}>{acct.name}</span>
        {acct.systemTag && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{acct.systemTag}</span>}
      </td>
      <td className="py-2.5 px-4">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[acct.accountType] ?? 'bg-muted text-muted-foreground'}`}>
          {acct.accountType}
        </span>
      </td>
      <td className={`py-2.5 px-4 text-sm font-mono text-right ${balColor}`}>
        {acct.allowPosting ? fmt(balance) : '—'}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          {!acct.isSystemAccount && (
            <>
              <button onClick={() => onEdit(acct)} className="p-1 rounded hover:bg-accent" title="Edit">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {acct._count?.children === 0 && (
                <button onClick={() => onDelete(acct)} className="p-1 rounded hover:bg-destructive/10" title="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', accountType: 'ASSET', parentId: '', description: '', openingBalance: '0' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/accounts?withBalance=true');
      if (res.ok) setAccounts((await res.json()).accounts);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      const matchType = !filterType || a.accountType === filterType;
      const q = search.toLowerCase();
      const matchSearch = !search || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [accounts, search, filterType]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ code: '', name: '', accountType: 'ASSET', parentId: '', description: '', openingBalance: '0' });
    setShowForm(true);
  };

  const openEdit = (acct: any) => {
    setEditTarget(acct);
    setForm({ code: acct.code, name: acct.name, accountType: acct.accountType, parentId: acct.parentId ?? '', description: acct.description ?? '', openingBalance: String(acct.openingBalance ?? 0) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error('Code and name are required'); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/finance/accounts/${editTarget.id}` : '/api/finance/accounts';
      const method = editTarget ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editTarget ? 'Account updated' : 'Account created');
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (acct: any) => {
    if (!confirm(`Delete account "${acct.code} ${acct.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/finance/accounts/${acct.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('Account deleted');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{accounts.length} accounts · Double-entry GL</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => setShowTemplate(true)}><Wand2 className="w-3.5 h-3.5 mr-1.5" />Choose Template</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Account</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9 rounded-xl" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['', ...ACCOUNT_TYPES].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 w-28">Code</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Name</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 w-32">Type</th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 w-36">Balance</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(12).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                  <td />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  {accounts.length === 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">No accounts yet. Start with a template or add accounts manually.</p>
                      <button
                        onClick={() => setShowTemplate(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'hsl(168 84% 26%)' }}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Choose a Template
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No accounts match your search</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map(acct => (
                <AccountRow
                  key={acct.id} acct={acct}
                  depth={Math.max(0, (acct.level ?? 1) - 1)}
                  onEdit={openEdit} onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Template Modal */}
      {showTemplate && (
        <TemplateModal onClose={() => setShowTemplate(false)} onSeeded={load} />
      )}

      {/* Create/Edit Drawer */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editTarget ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Code *</Label>
                <Input value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))} placeholder="e.g. 1110" className="h-9 rounded-xl" disabled={!!editTarget} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account Type *</Label>
                <select value={form.accountType} onChange={e => setForm(p => ({...p, accountType: e.target.value}))}
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm w-full" disabled={!!editTarget}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Account Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Cash on Hand" className="h-9 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Parent Account</Label>
              <select value={form.parentId} onChange={e => setForm(p => ({...p, parentId: e.target.value}))}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm w-full">
                <option value="">— None (top-level) —</option>
                {accounts.filter(a => !a.allowPosting || a.id !== editTarget?.id).map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Opening Balance</Label>
              <Input type="number" value={form.openingBalance} onChange={e => setForm(p => ({...p, openingBalance: e.target.value}))} className="h-9 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="h-9 rounded-xl" placeholder="Optional description" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><Check className="w-4 h-4 mr-1.5" />{editTarget ? 'Update' : 'Create'}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
