'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Users, Shield, Loader2, MoreVertical, Trash2, Mail, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Owner / Admin',
  TENANT_MANAGER: 'Manager',
  TENANT_USER: 'Staff',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  TENANT_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  TENANT_MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TENANT_USER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function TeamPage() {
  const { data: session } = useSession() || {};
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'TENANT_USER', password: '' });

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data?.members ?? []);
      }
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const inviteMember = async () => {
    if (!form.email || !form.firstName || !form.password) {
      toast.error('Email, first name, and password are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Team member added successfully');
        setShowInvite(false);
        setForm({ email: '', firstName: '', lastName: '', role: 'TENANT_USER', password: '' });
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to add member');
      }
    } catch { toast.error('Failed to add member'); }
    finally { setInviting(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isActive ? 'Member deactivated' : 'Member activated');
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to update');
      }
    } catch { toast.error('Failed to update'); }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast.success('Role updated');
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to update role');
      }
    } catch { toast.error('Failed to update role'); }
  };

  const removeMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Member removed');
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to remove');
      }
    } catch { toast.error('Failed to remove'); }
  };

  const isAdmin = ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role ?? '');
  const activeCount = members.filter(m => m.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{activeCount} active member{activeCount !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950"><Users className="w-4 h-4 text-blue-600" /></div><span className="text-sm text-muted-foreground">Total</span></div>
          <p className="text-2xl font-bold">{members.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-green-50 dark:bg-green-950"><Shield className="w-4 h-4 text-green-600" /></div><span className="text-sm text-muted-foreground">Active</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950"><Shield className="w-4 h-4 text-purple-600" /></div><span className="text-sm text-muted-foreground">Admins</span></div>
          <p className="text-2xl font-bold">{members.filter(m => ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(m.role)).length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950"><Users className="w-4 h-4 text-orange-600" /></div><span className="text-sm text-muted-foreground">Staff</span></div>
          <p className="text-2xl font-bold">{members.filter(m => m.role === 'TENANT_USER').length}</p>
        </CardContent></Card>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading team...</div>
      ) : (
        <div className="space-y-3">
          {members.map((m: any) => {
            const initials = `${(m.firstName ?? m.name?.[0] ?? 'U')[0]}${(m.lastName ?? '')[0] ?? ''}`;
            const isSelf = m.id === session?.user?.id;
            const canModify = isAdmin && !isSelf && !['TENANT_ADMIN', 'SUPER_ADMIN'].includes(m.role);

            return (
              <Card key={m.id} className={!m.isActive ? 'opacity-60' : ''}>
                <CardContent className="py-4 flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{m.firstName} {m.lastName}</p>
                      {isSelf && <Badge variant="outline" className="text-[10px]">You</Badge>}
                      <Badge className={`text-[10px] ${ROLE_COLORS[m.role] ?? ''}`}>{ROLE_LABELS[m.role] ?? m.role}</Badge>
                      {!m.isActive && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>
                      {m.lastLoginAt && <span className="items-center gap-1 hidden sm:flex"><Calendar className="w-3 h-3" /> Last login: {formatDateTime(m.lastLoginAt)}</span>}
                    </div>
                  </div>

                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => changeRole(m.id, m.role === 'TENANT_USER' ? 'TENANT_MANAGER' : 'TENANT_USER')}>
                          {m.role === 'TENANT_USER' ? 'Promote to Manager' : 'Set as Staff'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(m.id, m.isActive)}>
                          {m.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => removeMember(m.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to your business team. They will be able to log in with the credentials you set.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John" /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" /></div>
            </div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" /></div>
            <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT_USER">Staff — View and manage daily tasks</SelectItem>
                  <SelectItem value="TENANT_MANAGER">Manager — Full access except billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={inviteMember} disabled={inviting}>{inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
