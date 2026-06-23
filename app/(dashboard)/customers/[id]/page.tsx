'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ShoppingCart, MessageSquare, Tag, Plus, X, User, Clock, Pencil, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [customer, setCustomer] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', location: '', segment: '', notes: '' });
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchData = useCallback(async () => {
    try {
      const [custRes, tagsRes, timelineRes] = await Promise.all([
        fetch(`/api/customers/${params.id}`),
        fetch(`/api/customers/${params.id}/tags`),
        fetch(`/api/customers/${params.id}/timeline`),
      ]);
      if (custRes.ok) {
        const data = await custRes.json();
        const c = data?.customer ?? data;
        setCustomer(c);
        setEditForm({
          name: c?.name ?? '',
          phone: c?.phone ?? '',
          email: c?.email ?? '',
          location: c?.location ?? '',
          segment: c?.segment ?? 'New',
          notes: c?.notes ?? '',
        });
      }
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (timelineRes.ok) setTimeline(await timelineRes.json());
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      const res = await fetch(`/api/customers/${params.id}/tags`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags(prev => [tag, ...prev]);
        setNewTag('');
        toast.success('Tag added');
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } catch { toast.error('Failed to add tag'); }
  };

  const removeTag = async (tagId: string) => {
    try {
      await fetch(`/api/customers/${params.id}/tags?tagId=${tagId}`, { method: 'DELETE' });
      setTags(prev => prev.filter((t: any) => t.id !== tagId));
      toast.success('Tag removed');
    } catch { toast.error('Failed to remove tag'); }
  };

  const handleEdit = async () => {
    if (!editForm.phone.trim()) { toast.error('Phone number is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success('Customer updated');
        setShowEdit(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to update');
      }
    } catch { toast.error('Failed to update customer'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Customer deleted');
        router.replace('/customers');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch { toast.error('Failed to delete customer'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}</div>;
  if (!customer) return <div className="text-center py-12"><p className="text-muted-foreground">Customer not found</p></div>;

  const TIMELINE_ICONS: Record<string, any> = { order: ShoppingCart, conversation: MessageSquare, tag: Tag };
  const TIMELINE_COLORS: Record<string, string> = { order: 'text-blue-600 bg-blue-50 dark:bg-blue-950', conversation: 'text-green-600 bg-green-50 dark:bg-green-950', tag: 'text-purple-600 bg-purple-50 dark:bg-purple-950' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="font-display text-2xl font-bold tracking-tight">{customer.name ?? 'Unknown Customer'}</h1>
          <Badge variant="outline" className="ml-2">{customer.segment ?? 'New'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-4 h-4 mr-1.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              {customer.email && <p className="text-sm"><span className="text-muted-foreground">Email:</span> {customer.email}</p>}
              {customer.location && <p className="text-sm"><span className="text-muted-foreground">Location:</span> {customer.location}</p>}
              {customer.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {customer.notes}</p>}
              <p className="text-sm"><span className="text-muted-foreground">Since:</span> {formatDate(customer.createdAt)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Business Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-bold">{customer.totalOrders}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lifetime Value</span><span className="font-bold">{formatCurrency(customer.lifetimeValue, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg Order Value</span><span className="font-bold">{formatCurrency(customer.averageOrderValue, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Order</span><span>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Never'}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tags.map((t: any) => (
                  <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                    {t.tag}
                    <button onClick={() => removeTag(t.id)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet</p>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add tag..." value={newTag} onChange={(e: any) => setNewTag(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && addTag()} className="h-8 text-sm" />
                <Button size="sm" onClick={addTag} className="h-8"><Plus className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Clock className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No activity yet</p></div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event: any, idx: number) => {
                    const Icon = TIMELINE_ICONS[event.type] ?? Clock;
                    const colorClass = TIMELINE_COLORS[event.type] ?? 'text-gray-600 bg-gray-50';
                    return (
                      <div key={`${event.type}-${event.id}-${idx}`} className="flex gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{event.title}</p>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(event.date)}</span>
                          </div>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e: any) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={(e: any) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e: any) => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" value={editForm.location} onChange={(e: any) => setEditForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Segment</Label>
              <Select value={editForm.segment} onValueChange={(v: string) => setEditForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" placeholder="Internal notes about this customer..." value={editForm.notes} onChange={(e: any) => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{customer.name ?? 'this customer'}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}