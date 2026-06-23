'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Send, Megaphone, Loader2, CheckCircle, Mail, Phone } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', messageTemplate: '', segment: '', channel: 'both' });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const createCampaign = async () => {
    if (!form.name || !form.messageTemplate) { toast.error('Name and message are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          messageTemplate: form.messageTemplate,
          segmentFilter: form.segment ? { segment: form.segment } : {},
          channel: form.channel,
        }),
      });
      if (res.ok) {
        toast.success('Campaign created');
        setShowCreate(false);
        setForm({ name: '', messageTemplate: '', segment: '', channel: 'both' });
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } catch { toast.error('Failed to create campaign'); }
    finally { setCreating(false); }
  };

  const sendCampaign = async (id: string) => {
    setSending(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } catch { toast.error('Failed to send campaign'); }
    finally { setSending(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Marketing Campaigns</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />New Campaign</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950"><Megaphone className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Campaigns</p><p className="text-xl font-bold">{total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Completed</p><p className="text-xl font-bold">{campaigns.filter((c: any) => c.status === 'completed').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950"><Send className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-sm text-muted-foreground">Messages Sent</p><p className="text-xl font-bold">{campaigns.reduce((s: number, c: any) => s + (c.sentCount ?? 0), 0)}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No campaigns yet. Create your first campaign!</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[c.status] ?? 'bg-gray-100'}>{c.status}</Badge></TableCell>
                    <TableCell>{c.targetCustomerCount}</TableCell>
                    <TableCell>{c.sentCount}</TableCell>
                    <TableCell>{c.deliveredCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell>
                      {c.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => sendCampaign(c.id)} disabled={sending === c.id}>
                          {sending === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                          Send
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g. Weekend Sale Blast" value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Target Segment</Label>
              <Select value={form.segment} onValueChange={(v: string) => setForm(p => ({ ...p, segment: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Broadcast Channel</Label>
              <Select value={form.channel} onValueChange={(v: string) => setForm(p => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both"><span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /><Mail className="w-3 h-3" /> SMS + Email</span></SelectItem>
                  <SelectItem value="sms"><span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> SMS Only</span></SelectItem>
                  <SelectItem value="email"><span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Only</span></SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">SMS requires SMS provider setup in Settings → Notifications. Email goes to customers with email on file.</p>
            </div>
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea
                placeholder={'Hello {{name}}, we have an exciting offer for you! ...'}
                value={form.messageTemplate}
                onChange={(e: any) => setForm(p => ({ ...p, messageTemplate: e.target.value }))}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{'Use {{name}} to personalize with customer name'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createCampaign} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
