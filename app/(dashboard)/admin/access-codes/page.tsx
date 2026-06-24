'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Copy, CheckCircle, KeyRound, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Plan { id: string; name: string }
interface AccessCode {
  id: string;
  code: string;
  isUsed: boolean;
  billingCycle: string;
  expiresAt: string | null;
  usedAt: string | null;
  note: string | null;
  createdAt: string;
  plan: { name: string };
}

export default function AccessCodesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const [form, setForm] = useState({
    planId: '',
    billingCycle: 'monthly',
    expiresInDays: '',
    note: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, codesRes] = await Promise.all([
        fetch('/api/onboarding/plans'),
        fetch('/api/admin/access-codes'),
      ]);
      const plansData = await plansRes.json();
      const codesData = await codesRes.json();
      if (plansData.plans) setPlans(plansData.plans);
      if (codesData.codes) setCodes(codesData.codes);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!form.planId) { toast.error('Please select a plan'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: form.planId,
          billingCycle: form.billingCycle,
          expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to generate code'); return; }
      toast.success(`Code generated: ${data.accessCode.code}`);
      await navigator.clipboard.writeText(data.accessCode.code).catch(() => {});
      fetchData();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedId(''), 2000);
    });
  };

  const isExpired = (expiresAt: string | null) =>
    expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" /> Access Codes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate single-use codes for tenants who paid via cash or manual bank transfer.
        </p>
      </div>

      {/* Generate form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate New Code</CardTitle>
          <CardDescription>Each code activates a subscription plan for one tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Subscription Plan *</Label>
              <Select value={form.planId} onValueChange={(v) => setForm(p => ({ ...p, planId: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Billing Cycle</Label>
              <Select value={form.billingCycle} onValueChange={(v) => setForm(p => ({ ...p, billingCycle: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Expires in (days)</Label>
              <Input
                type="number"
                placeholder="Never"
                min={1}
                value={form.expiresInDays}
                onChange={(e) => setForm(p => ({ ...p, expiresInDays: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Note (optional)</Label>
              <Input
                placeholder="e.g. Amara Okafor payment"
                value={form.note}
                onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !form.planId} className="font-semibold">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Generate Code
          </Button>
        </CardContent>
      </Card>

      {/* Codes list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">All Access Codes ({codes.length})</h2>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No access codes yet. Generate one above.</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => (
                  <tr key={c.id} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-3 font-mono font-bold tracking-wider text-primary">{c.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.plan.name}
                      <span className="ml-1.5 text-xs opacity-70 capitalize">({c.billingCycle})</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.isUsed ? (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />Used
                        </Badge>
                      ) : isExpired(c.expiresAt) ? (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />Expired
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[180px] truncate">
                      {c.note ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {!c.isUsed && !isExpired(c.expiresAt) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(c.code, c.id)}
                          className="h-8 text-xs"
                        >
                          {copiedId === c.id
                            ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-primary" /> Copied</>
                            : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</>
                          }
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
