'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Users, Package, ShoppingCart, DollarSign,
  Search, RefreshCw, Shield, Globe, UserCheck, AlertTriangle,
  TrendingUp, Activity, CheckCircle2, XCircle, Pencil, Plus, Trash2, CreditCard, Wallet, Save, Loader2, TriangleAlert,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlanInfo {
  id: string;
  name: string;
  description: string | null;
  priceNgnMonthly: number;
  priceNgnYearly: number;
  priceUsdMonthly: number;
  priceUsdYearly: number;
  features: Record<string, boolean | string>;
  maxAiConversations: number;
  maxProducts: number;
  maxUsers: number;
  maxStorageMb: number;
  maxBroadcastsMonthly: number;
  apiAccess: boolean;
  customAiTraining: boolean;
  prioritySupport: boolean;
  isActive: boolean;
  displayOrder: number;
  _count: { subscriptions: number };
}

const emptyPlan: Omit<PlanInfo, 'id' | '_count'> = {
  name: '', description: '',
  priceNgnMonthly: 0, priceNgnYearly: 0, priceUsdMonthly: 0, priceUsdYearly: 0,
  features: {}, maxAiConversations: 1000, maxProducts: 30, maxUsers: 1,
  maxStorageMb: 1024, maxBroadcastsMonthly: 0,
  apiAccess: false, customAiTraining: false, prioritySupport: false,
  isActive: true, displayOrder: 99,
};

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  defaultCurrency: string;
  createdAt: string;
  trialEndsAt: string | null;
  plan: string;
  planStatus: string;
  adminEmail: string;
  adminName: string;
  userCount: number;
  productCount: number;
  orderCount: number;
  customerCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [recentTenants, setRecentTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantInfo | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [editPlan, setEditPlan] = useState<PlanInfo | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planForm, setPlanForm] = useState<Omit<PlanInfo, 'id' | '_count'>>(emptyPlan);
  const [planSaving, setPlanSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [payConfig, setPayConfig] = useState<any>({});
  const [paySaving, setPaySaving] = useState(false);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStats(data.stats);
      setRecentTenants(data.recentTenants);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPlans(data.plans.map((p: any) => ({
        ...p,
        priceNgnMonthly: Number(p.priceNgnMonthly),
        priceNgnYearly: Number(p.priceNgnYearly),
        priceUsdMonthly: Number(p.priceUsdMonthly),
        priceUsdYearly: Number(p.priceUsdYearly),
      })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchPayConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-config');
      if (res.ok) { const d = await res.json(); setPayConfig(d?.config ?? {}); }
    } catch (e) { console.error(e); }
  }, []);

  const fetchTenants = useCallback(async (q = '') => {
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTenants(data.tenants);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    Promise.all([fetchOverview(), fetchTenants(), fetchPlans(), fetchPayConfig()]).then(() => setLoading(false));
  }, [session, status, router, fetchOverview, fetchTenants, fetchPlans, fetchPayConfig]);

  const handleSearch = () => fetchTenants(search);

  const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
    setToggling(id);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Success', description: `Tenant ${currentStatus ? 'deactivated' : 'activated'}` });
      await Promise.all([fetchOverview(), fetchTenants(search)]);
    } catch {
      toast({ title: 'Error', description: 'Failed to update tenant', variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const openDeleteDialog = (tenant: TenantInfo) => {
    setDeleteTarget(tenant);
    setDeleteConfirmText('');
  };

  const executeTenantDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Delete failed');
      toast({ title: 'Tenant deleted', description: data.message });
      setDeleteTarget(null);
      await Promise.all([fetchOverview(), fetchTenants(search)]);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openCreatePlan = () => {
    setEditPlan(null);
    setPlanForm({ ...emptyPlan });
    setFeaturesText('');
    setShowPlanDialog(true);
  };

  const openEditPlan = (plan: PlanInfo) => {
    setEditPlan(plan);
    const feats = plan.features && typeof plan.features === 'object'
      ? Object.entries(plan.features).filter(([, v]) => v).map(([k, v]) => typeof v === 'string' ? v : k).join('\n')
      : '';
    setPlanForm({
      name: plan.name, description: plan.description || '',
      priceNgnMonthly: plan.priceNgnMonthly, priceNgnYearly: plan.priceNgnYearly,
      priceUsdMonthly: plan.priceUsdMonthly, priceUsdYearly: plan.priceUsdYearly,
      features: plan.features || {},
      maxAiConversations: plan.maxAiConversations, maxProducts: plan.maxProducts,
      maxUsers: plan.maxUsers, maxStorageMb: plan.maxStorageMb,
      maxBroadcastsMonthly: plan.maxBroadcastsMonthly,
      apiAccess: plan.apiAccess, customAiTraining: plan.customAiTraining,
      prioritySupport: plan.prioritySupport, isActive: plan.isActive, displayOrder: plan.displayOrder,
    });
    setFeaturesText(feats);
    setShowPlanDialog(true);
  };

  const savePlan = async () => {
    setPlanSaving(true);
    try {
      const featureObj: Record<string, string> = {};
      featuresText.split('\n').map(s => s.trim()).filter(Boolean).forEach((f, i) => {
        const key = f.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `feature_${i}`;
        featureObj[key] = f;
      });
      const payload = { ...planForm, features: featureObj };

      const url = editPlan ? `/api/admin/plans/${editPlan.id}` : '/api/admin/plans';
      const method = editPlan ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast({ title: 'Success', description: editPlan ? 'Plan updated' : 'Plan created' });
      setShowPlanDialog(false);
      await fetchPlans();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save plan', variant: 'destructive' });
    } finally {
      setPlanSaving(false);
    }
  };

  const deletePlan = async (plan: PlanInfo) => {
    if (!confirm(`Are you sure you want to ${plan._count.subscriptions > 0 ? 'deactivate' : 'delete'} "${plan.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Success', description: plan._count.subscriptions > 0 ? 'Plan deactivated' : 'Plan deleted' });
      await fetchPlans();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
    }
  };

  const updateForm = (field: string, value: any) => setPlanForm(prev => ({ ...prev, [field]: value }));
  const updatePay = (field: string, value: any) => setPayConfig((prev: any) => ({ ...prev, [field]: value }));

  const savePayConfig = async () => {
    setPaySaving(true);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      toast({ title: 'Success', description: data?.message || 'Config saved. Redeploy to apply in production.' });
      await fetchPayConfig();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setPaySaving(false); }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  const statCards = [
    { label: 'Total Companies', value: stats?.totalTenants ?? 0, icon: Building2, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Companies', value: stats?.activeTenants ?? 0, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'from-orange-500 to-orange-600' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'from-pink-500 to-pink-600' },
    { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: UserCheck, color: 'from-teal-500 to-teal-600' },
    { label: 'Platform Revenue', value: `₦${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Active Rate', value: stats?.totalTenants ? `${Math.round(((stats?.activeTenants ?? 0) / stats.totalTenants) * 100)}%` : '0%', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
          <p className="text-sm text-muted-foreground">Manage all registered companies and monitor platform activity</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview"><Activity className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="tenants"><Building2 className="w-4 h-4 mr-1.5" />Companies</TabsTrigger>
          <TabsTrigger value="plans"><CreditCard className="w-4 h-4 mr-1.5" />Plans</TabsTrigger>
          <TabsTrigger value="payments"><Wallet className="w-4 h-4 mr-1.5" />Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Card key={card.label} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Companies</CardTitle>
              <CardDescription>Latest registered companies on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Company</th>
                      <th className="pb-3 font-semibold">Plan</th>
                      <th className="pb-3 font-semibold">Users</th>
                      <th className="pb-3 font-semibold">Products</th>
                      <th className="pb-3 font-semibold">Orders</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTenants.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.email || t.subdomain}</p>
                          </div>
                        </td>
                        <td className="py-3"><Badge variant="secondary">{t.plan}</Badge></td>
                        <td className="py-3">{t.userCount}</td>
                        <td className="py-3">{t.productCount}</td>
                        <td className="py-3">{t.orderCount}</td>
                        <td className="py-3">
                          <Badge variant={t.isActive ? 'default' : 'destructive'}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {recentTenants.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No companies registered yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or subdomain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="w-4 h-4 mr-1.5" />Search
            </Button>
            <Button onClick={() => { setSearch(''); fetchTenants(''); }} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Tenant Cards */}
          <div className="grid gap-4">
            {tenants.map((t) => (
              <Card key={t.id} className={!t.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-base">{t.name}</h3>
                        <Badge variant={t.isActive ? 'default' : 'destructive'} className="text-[11px]">
                          {t.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">{t.plan}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{t.subdomain}</span>
                        {t.email && <span>{t.email}</span>}
                        {t.industry && <span>{t.industry}</span>}
                        <span>Admin: {t.adminName} ({t.adminEmail})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-lg">{t.userCount}</p>
                        <p className="text-muted-foreground">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{t.productCount}</p>
                        <p className="text-muted-foreground">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{t.orderCount}</p>
                        <p className="text-muted-foreground">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{t.customerCount}</p>
                        <p className="text-muted-foreground">Customers</p>
                      </div>
                      <Button
                        variant={t.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleTenantStatus(t.id, t.isActive)}
                        disabled={toggling === t.id}
                      >
                        {toggling === t.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : t.isActive ? (
                          <><XCircle className="w-3.5 h-3.5 mr-1" />Deactivate</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Activate</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => openDeleteDialog(t)}
                        disabled={toggling === t.id}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                  {t.trialEndsAt && new Date(t.trialEndsAt) > new Date() && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Trial ends {new Date(t.trialEndsAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {tenants.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No companies found
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Subscription Plans</h2>
              <p className="text-sm text-muted-foreground">Create and manage subscription plans for tenants</p>
            </div>
            <Button onClick={openCreatePlan}>
              <Plus className="w-4 h-4 mr-1.5" />New Plan
            </Button>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.isActive ? 'opacity-60 border-dashed' : ''}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{plan.name}</h3>
                        <Badge variant={plan.isActive ? 'default' : 'destructive'} className="text-[11px]">
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {plan._count.subscriptions} subscriber{plan._count.subscriptions !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px]">Order: {plan.displayOrder}</Badge>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-[11px] text-muted-foreground">NGN Monthly</p>
                          <p className="font-bold">₦{plan.priceNgnMonthly.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-[11px] text-muted-foreground">USD Monthly</p>
                          <p className="font-bold">${plan.priceUsdMonthly.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-[11px] text-muted-foreground">NGN Yearly</p>
                          <p className="font-bold">₦{plan.priceNgnYearly.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-[11px] text-muted-foreground">USD Yearly</p>
                          <p className="font-bold">${plan.priceUsdYearly.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground pt-1">
                        <span><strong>{plan.maxProducts}</strong> products</span>
                        <span><strong>{plan.maxUsers}</strong> users</span>
                        <span><strong>{plan.maxStorageMb}</strong> MB storage</span>
                        <span><strong>{plan.maxAiConversations}</strong> AI convos</span>
                        <span><strong>{plan.maxBroadcastsMonthly}</strong> broadcasts/mo</span>
                        {plan.apiAccess && <Badge variant="secondary" className="text-[10px]">API</Badge>}
                        {plan.customAiTraining && <Badge variant="secondary" className="text-[10px]">Custom AI</Badge>}
                        {plan.prioritySupport && <Badge variant="secondary" className="text-[10px]">Priority Support</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEditPlan(plan)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePlan(plan)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" />{plan._count.subscriptions > 0 ? 'Deactivate' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No plans created yet. Click &quot;New Plan&quot; to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Payment Gateway Configuration</CardTitle>
              <CardDescription>Configure payment service providers used for tenant subscription billing. Changes require redeployment to take effect in production.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Active Payment Gateway</Label>
                <Select value={payConfig.activeGateway || 'paystack'} onValueChange={v => updatePay('activeGateway', v)}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Paystack {payConfig.hasPaystack && <Badge variant="secondary" className="text-[10px]">Configured</Badge>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret Key</Label>
                    <Input type="password" value={payConfig.paystackSecretKey || ''} onChange={e => updatePay('paystackSecretKey', e.target.value)} placeholder="sk_test_..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Public Key</Label>
                    <Input value={payConfig.paystackPublicKey || ''} onChange={e => updatePay('paystackPublicKey', e.target.value)} placeholder="pk_test_..." />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Flutterwave {payConfig.hasFlutterwave && <Badge variant="secondary" className="text-[10px]">Configured</Badge>}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret Key</Label>
                    <Input type="password" value={payConfig.flutterwaveSecretKey || ''} onChange={e => updatePay('flutterwaveSecretKey', e.target.value)} placeholder="FLWSECK_TEST-..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Public Key</Label>
                    <Input value={payConfig.flutterwavePublicKey || ''} onChange={e => updatePay('flutterwavePublicKey', e.target.value)} placeholder="FLWPUBK_TEST-..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Webhook Hash</Label>
                    <Input type="password" value={payConfig.flutterwaveWebhookHash || ''} onChange={e => updatePay('flutterwaveWebhookHash', e.target.value)} placeholder="Webhook verification hash" />
                  </div>
                </div>
              </div>

              <Button onClick={savePayConfig} disabled={paySaving}>
                {paySaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                Save Payment Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tenant Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="w-5 h-5" />
              Permanently Delete Tenant
            </DialogTitle>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-sm">
                <p className="font-semibold text-destructive">This action cannot be undone.</p>
                <p className="text-muted-foreground">
                  Deleting <span className="font-semibold text-foreground">{deleteTarget.name}</span> will permanently erase:
                </p>
                <ul className="space-y-1 text-muted-foreground pl-4 list-disc">
                  <li><span className="font-medium text-foreground">{deleteTarget.userCount}</span> user account{deleteTarget.userCount !== 1 ? 's' : ''}</li>
                  <li><span className="font-medium text-foreground">{deleteTarget.productCount}</span> product{deleteTarget.productCount !== 1 ? 's' : ''}</li>
                  <li><span className="font-medium text-foreground">{deleteTarget.orderCount}</span> order{deleteTarget.orderCount !== 1 ? 's' : ''}</li>
                  <li><span className="font-medium text-foreground">{deleteTarget.customerCount}</span> customer{deleteTarget.customerCount !== 1 ? 's' : ''}</li>
                  <li>All conversations, campaigns, payments, and settings</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Type <span className="font-mono font-bold">{deleteTarget.name}</span> to confirm:
                </Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  className="border-destructive/40 focus-visible:ring-destructive"
                  disabled={deleting}
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeTenantDelete}
              disabled={deleting || deleteConfirmText !== deleteTarget?.name}
            >
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting…</> : <><Trash2 className="w-4 h-4 mr-2" />Permanently Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Create/Edit Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Name & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Plan Name *</Label>
                <Input id="plan-name" value={planForm.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Business Pro" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-order">Display Order</Label>
                <Input id="plan-order" type="number" value={planForm.displayOrder} onChange={e => updateForm('displayOrder', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">Description</Label>
              <Textarea id="plan-desc" value={planForm.description || ''} onChange={e => updateForm('description', e.target.value)} rows={2} placeholder="Brief plan description..." />
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Pricing</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">NGN Monthly</Label>
                  <Input type="number" value={planForm.priceNgnMonthly} onChange={e => updateForm('priceNgnMonthly', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">NGN Yearly</Label>
                  <Input type="number" value={planForm.priceNgnYearly} onChange={e => updateForm('priceNgnYearly', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">USD Monthly</Label>
                  <Input type="number" value={planForm.priceUsdMonthly} onChange={e => updateForm('priceUsdMonthly', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">USD Yearly</Label>
                  <Input type="number" value={planForm.priceUsdYearly} onChange={e => updateForm('priceUsdYearly', Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Limits */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Limits</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Max Products</Label>
                  <Input type="number" value={planForm.maxProducts} onChange={e => updateForm('maxProducts', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Users</Label>
                  <Input type="number" value={planForm.maxUsers} onChange={e => updateForm('maxUsers', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Storage (MB)</Label>
                  <Input type="number" value={planForm.maxStorageMb} onChange={e => updateForm('maxStorageMb', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">AI Conversations</Label>
                  <Input type="number" value={planForm.maxAiConversations} onChange={e => updateForm('maxAiConversations', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Broadcasts/Month</Label>
                  <Input type="number" value={planForm.maxBroadcastsMonthly} onChange={e => updateForm('maxBroadcastsMonthly', Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Feature Flags</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg border">
                  <Label className="text-sm">API Access</Label>
                  <Switch checked={planForm.apiAccess} onCheckedChange={v => updateForm('apiAccess', v)} />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border">
                  <Label className="text-sm">Custom AI Training</Label>
                  <Switch checked={planForm.customAiTraining} onCheckedChange={v => updateForm('customAiTraining', v)} />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border">
                  <Label className="text-sm">Priority Support</Label>
                  <Switch checked={planForm.prioritySupport} onCheckedChange={v => updateForm('prioritySupport', v)} />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border">
                  <Label className="text-sm">Active</Label>
                  <Switch checked={planForm.isActive} onCheckedChange={v => updateForm('isActive', v)} />
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                rows={4}
                placeholder={"AI business assistant\nProduct management\nCustomer analytics\nEmail marketing"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
            <Button onClick={savePlan} disabled={planSaving || !planForm.name}>
              {planSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {editPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
