'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const ENTITY_TYPES = ['Order', 'Expense', 'FixedAsset', 'Customer', 'Product', 'Payment', 'User', 'Settings'];

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DELETED: 'bg-red-50 text-red-700 border-red-200',
  UPDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-orange-50 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  DEFAULT: 'bg-gray-50 text-gray-700 border-gray-200',
};

function actionBadgeClass(action: string): string {
  const suffix = action.split('_').pop() ?? '';
  return ACTION_COLORS[suffix] ?? ACTION_COLORS.DEFAULT;
}

export default function AuditTrailPage() {
  const [items, setItems]   = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch]   = useState('');
  const [entity, setEntity]   = useState('all');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '50' });
      if (search) params.set('search', search);
      if (entity && entity !== 'all') params.set('entity', entity);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/audit-log?${params}`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items ?? []);
        setTotal(d.total ?? 0);
        setPage(p);
      }
    } finally { setLoading(false); }
  }, [search, entity, from, to]);

  useEffect(() => { load(1); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Track every action performed by users in your account</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="pt-5">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9"
                  placeholder="Search actions, users, summaries…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-44">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Entity type</label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
              <Input type="date" className="h-9 w-38" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              <Input type="date" className="h-9 w-38" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="h-9 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => load(page)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-40">Date / Time</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">User</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-36">Action</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">Entity</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading…
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No audit entries found. Actions performed in your account will appear here.
                  </td></tr>
                ) : items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs truncate max-w-28">{item.userName || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${actionBadgeClass(item.action)}`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px]">{item.entity}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/80">{item.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => load(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
