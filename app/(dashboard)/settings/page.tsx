'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Bot, CreditCard, Save, CheckCircle2, Loader2, Key, AlertTriangle, CheckCircle, Cpu, Wallet, Bell, Mail, XCircle, Send, ExternalLink, Copy, HardDrive, ShoppingCart, Globe, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function EmailTestSection() {
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [rechecking, setRechecking] = useState(false);

  const checkConfig = async () => {
    setRechecking(true);
    try {
      const res = await fetch('/api/settings/test-email', { cache: 'no-store' });
      const d = await res.json();
      setConfigured(d.configured ?? false);
      setMissing(d.missing ?? []);
    } catch {
      setConfigured(false);
    } finally {
      setRechecking(false);
    }
  };

  useEffect(() => { checkConfig(); }, []);

  const sendTest = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/settings/test-email', { method: 'POST' });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error ?? 'Test email failed');
    } catch {
      toast.error('Network error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">Email Broadcasts (SMTP)</h4>
        </div>
        <div className="flex items-center gap-2">
          {configured === null || rechecking ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking…
            </span>
          ) : configured ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Not configured
            </span>
          )}
          <button
            onClick={checkConfig}
            disabled={rechecking}
            className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-40"
          >
            Re-check
          </button>
        </div>
      </div>

      {configured === false && missing.length > 0 && (
        <div className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded p-3 space-y-1">
          <p className="font-medium text-foreground">
            Missing env vars (add to your server <code className="bg-muted px-1 py-0.5 rounded">.env</code>, then restart the app container):
          </p>
          <pre className="text-[11px] font-mono text-destructive leading-5">{missing.join('\n')}</pre>
          <p className="text-muted-foreground">
            For Gmail use port 587 with an <strong>App Password</strong> (myaccount.google.com → Security → App Passwords).
            After editing .env, run: <code className="bg-muted px-1 rounded">docker compose restart app</code>
            then click <strong>Re-check</strong> above.
          </p>
        </div>
      )}

      {configured && (
        <p className="text-xs text-muted-foreground">
          Campaign emails will be sent from your configured SMTP address to all customers who have an email on file.
        </p>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={sendTest}
        disabled={status === 'sending'}
        className="gap-2"
      >
        {status === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Send Test Email to My Account
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, update } = useSession() || {};
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState<any>({});
  const [aiConfig, setAiConfig] = useState<any>({});
  const [billing, setBilling] = useState<any>({});
  const [storageInfo, setStorageInfo] = useState<{ usedMb: number; limitMb: number; percentUsed: number; breakdown?: { database: string; files: string; total: string } } | null>(null);
  const [saving, setSaving] = useState(false);
  const [llmConfig, setLlmConfig] = useState<any>({});
  const [llmSaving, setLlmSaving] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>({
    enabledMethods: [] as string[],
    bankName: '', accountNumber: '', accountName: '',
    mobileMoneyCurrency: 'NGN', mobileMoneyInstructions: '',
    gateway: 'paystack', paystackSecretKey: '', paystackPublicKey: '',
    flutterwaveSecretKey: '', flutterwavePublicKey: '', flutterwaveWebhookHash: '',
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [smsConfig, setSmsConfig] = useState<any>({ provider: 'termii', termiiApiKey: '', termiiSenderId: '', africastalkingApiKey: '', africastalkingUsername: '', africastalkingSenderId: '' });
  const [smsSaving, setSmsSaving] = useState(false);
  const [financeConfig, setFinanceConfig] = useState<any>({ glPostingMode: 'AUTO', glAccountMappings: {}, fixedAssetCategoryMappings: {} });
  const [financeSaving, setFinanceSaving] = useState(false);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const fetchProfile = useCallback(async () => {
    try { const r = await fetch('/api/settings/profile'); if (r.ok) { const d = await r.json(); setProfile(d?.tenant ?? {}); } } catch (e: any) { console.error(e); }
  }, []);
  const fetchAi = useCallback(async () => {
    try { const r = await fetch('/api/settings/ai'); if (r.ok) { const d = await r.json(); setAiConfig(d?.config ?? {}); } } catch (e: any) { console.error(e); }
  }, []);
  const fetchBilling = useCallback(async () => {
    try { const r = await fetch('/api/settings/billing'); if (r.ok) { const d = await r.json(); setBilling(d ?? {}); } } catch (e: any) { console.error(e); }
  }, []);
  const fetchStorage = useCallback(async () => {
    try { const r = await fetch('/api/settings/storage'); if (r.ok) { const d = await r.json(); setStorageInfo(d); } } catch (e: any) { console.error(e); }
  }, []);
  const fetchLlm = useCallback(async () => {
    try { const r = await fetch('/api/settings/llm'); if (r.ok) { const d = await r.json(); setLlmConfig(d ?? {}); } } catch (e: any) { console.error(e); }
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!confirm('Switch to this plan? Your subscription will be updated immediately.')) return;
    setUpgradingPlan(planId);
    try {
      const res = await fetch('/api/settings/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      toast.success(data?.message || 'Plan updated successfully');
      await fetchBilling();
    } catch (e: any) {
      toast.error(e.message || 'Failed to switch plan');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const fetchPaymentConfig = useCallback(async () => {
    try { const r = await fetch('/api/settings/payment-config'); if (r.ok) { const d = await r.json(); if (d?.config) setPaymentConfig((prev: any) => ({ ...prev, ...d.config })); } } catch (e: any) { console.error(e); }
  }, []);

  const savePaymentConfig = async () => {
    setPaymentSaving(true);
    try {
      const res = await fetch('/api/settings/payment-config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentConfig) });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || 'Failed'); }
      toast.success('Payment settings saved');
    } catch (e: any) { toast.error(e.message || 'Failed to save payment settings'); } finally { setPaymentSaving(false); }
  };

  const fetchSmsConfig = useCallback(async () => {
    try { const r = await fetch('/api/settings/sms-config'); if (r.ok) { const d = await r.json(); if (d?.config) setSmsConfig((prev: any) => ({ ...prev, ...d.config })); } } catch (e: any) { console.error(e); }
  }, []);

  const fetchFinanceConfig = useCallback(async () => {
    try {
      const [fRes, aRes] = await Promise.all([
        fetch('/api/settings/finance'),
        fetch('/api/finance/accounts'),
      ]);
      if (fRes.ok) { const d = await fRes.json(); setFinanceConfig(d); }
      if (aRes.ok) { const d = await aRes.json(); setGlAccounts(d.accounts ?? []); }
    } catch (e: any) { console.error(e); }
  }, []);

  const saveFinanceConfig = async () => {
    setFinanceSaving(true);
    try {
      const res = await fetch('/api/settings/finance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(financeConfig) });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || 'Failed'); }
      toast.success('Finance settings saved');
    } catch (e: any) { toast.error(e.message || 'Failed to save finance settings'); } finally { setFinanceSaving(false); }
  };

  const saveSmsConfig = async () => {
    setSmsSaving(true);
    try {
      const res = await fetch('/api/settings/sms-config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(smsConfig) });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || 'Failed'); }
      toast.success('SMS settings saved');
    } catch (e: any) { toast.error(e.message || 'Failed to save SMS settings'); } finally { setSmsSaving(false); }
  };

  useEffect(() => { fetchProfile(); fetchAi(); fetchBilling(); fetchStorage(); fetchPaymentConfig(); fetchSmsConfig(); }, [fetchProfile, fetchAi, fetchBilling, fetchStorage, fetchPaymentConfig, fetchSmsConfig]);
  useEffect(() => { if (tab === 'finance') fetchFinanceConfig(); }, [tab, fetchFinanceConfig]);
  useEffect(() => { if (isSuperAdmin) fetchLlm(); }, [isSuperAdmin, fetchLlm]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: profile?.businessName, description: profile?.description, address: profile?.address, city: profile?.city, state: profile?.state, country: profile?.country, phone: profile?.phone, email: profile?.email, website: profile?.website, defaultCurrency: profile?.defaultCurrency }) });
      if (res.ok) { toast.success('Profile updated successfully'); await update(); } else toast.error('Failed to update profile');
    } catch (e: any) { toast.error('Error saving profile'); } finally { setSaving(false); }
  };

  const saveAi = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/ai', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ welcomeMessage: aiConfig?.welcomeMessage, personality: aiConfig?.personality, autoReply: aiConfig?.autoReply }) });
      if (res.ok) toast.success('AI settings updated'); else toast.error('Failed to update');
    } catch (e: any) { toast.error('Error'); } finally { setSaving(false); }
  };

  const saveLlm = async () => {
    setLlmSaving(true);
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmConfig?.provider || 'auto',
          apiKey: llmConfig?.apiKey || '',
          baseUrl: llmConfig?.baseUrl || '',
          model: llmConfig?.model || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data?.warning) {
          toast.warning(data.warning);
        } else {
          toast.success('LLM provider settings saved successfully');
        }
        fetchLlm();
      } else {
        toast.error(data?.error || 'Failed to save LLM settings');
      }
    } catch (e: any) {
      toast.error('Error saving LLM settings');
    } finally {
      setLlmSaving(false);
    }
  };

  const upd = (setter: any, key: string, val: any) => setter((prev: any) => ({ ...(prev ?? {}), [key]: val }));
  const currency = session?.user?.tenantCurrency ?? 'NGN';
  const plan = billing?.subscription?.plan;
  const usage = billing?.usage ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your business configuration</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Bot className="w-4 h-4" /><span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4" /><span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Wallet className="w-4 h-4" /><span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4" /><span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Business Profile</CardTitle>
              <CardDescription>Update your business information visible to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Store URL */}
              {profile?.subdomain && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Your Store URL</p>
                    <p className="text-sm font-mono font-medium text-primary truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/store/${profile.subdomain}` : `/store/${profile.subdomain}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Copy link"
                      onClick={() => {
                        const url = `${window.location.origin}/store/${profile.subdomain}`;
                        navigator.clipboard.writeText(url).then(() => toast.success('Store URL copied'));
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Open store"
                      onClick={() => window.open(`/store/${profile.subdomain}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-sm font-medium">Business Name</Label><Input className="h-10" value={profile?.businessName ?? ''} onChange={(e: any) => upd(setProfile, 'businessName', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium">Phone</Label><Input className="h-10" value={profile?.phone ?? ''} onChange={(e: any) => upd(setProfile, 'phone', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium">Email</Label><Input className="h-10" value={profile?.email ?? ''} onChange={(e: any) => upd(setProfile, 'email', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium">Website</Label><Input className="h-10" value={profile?.website ?? ''} onChange={(e: any) => upd(setProfile, 'website', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-sm font-medium">Description</Label><Textarea value={profile?.description ?? ''} onChange={(e: any) => upd(setProfile, 'description', e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-sm font-medium">Address</Label><Input className="h-10" value={profile?.address ?? ''} onChange={(e: any) => upd(setProfile, 'address', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium">City</Label><Input className="h-10" value={profile?.city ?? ''} onChange={(e: any) => upd(setProfile, 'city', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium">Country</Label><Input className="h-10" value={profile?.country ?? ''} onChange={(e: any) => upd(setProfile, 'country', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default Currency</Label>
                  <Select value={profile?.defaultCurrency ?? 'NGN'} onValueChange={(v: string) => upd(setProfile, 'defaultCurrency', v)}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">₦ Nigerian Naira (NGN)</SelectItem>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">This currency will be used across all financial records, invoices, and reports</p>
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="h-10">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="mt-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">AI Assistant Configuration</CardTitle>
              <CardDescription>Customize how the AI interacts with your customers via the chat widget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Welcome Message</Label>
                <Textarea value={aiConfig?.welcomeMessage ?? ''} onChange={(e: any) => upd(setAiConfig, 'welcomeMessage', e.target.value)} rows={3} placeholder="Hello! Welcome to our store. How can I help you today?" />
                <p className="text-[11px] text-muted-foreground">Sent automatically when a new customer messages your business</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Personality</Label>
                <Textarea value={aiConfig?.personality ?? ''} onChange={(e: any) => upd(setAiConfig, 'personality', e.target.value)} rows={3} placeholder="e.g. Friendly, helpful sales assistant who speaks Pidgin and English..." />
                <p className="text-[11px] text-muted-foreground">Describe how the AI should communicate — tone, language, style</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Auto-reply to messages</p>
                    <p className="text-xs text-muted-foreground">AI will respond automatically to incoming chat messages</p>
                  </div>
                </div>
                <Switch checked={aiConfig?.autoReply ?? true} onCheckedChange={(v: boolean) => upd(setAiConfig, 'autoReply', v)} />
              </div>
              <Button onClick={saveAi} disabled={saving} className="h-10">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : 'Save AI Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* LLM Provider Config - Super Admin Only */}
          {isSuperAdmin && (
            <Card className="shadow-sm border-border/50 mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Cpu className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Provider Configuration</CardTitle>
                    <CardDescription>Configure which AI model powers your assistant. Only visible to super admins.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Provider</Label>
                  <Select
                    value={llmConfig?.provider || 'auto'}
                    onValueChange={(v) => {
                      upd(setLlmConfig, 'provider', v);
                      // Auto-fill defaults when switching providers
                      if (v === 'deepseek') {
                        upd(setLlmConfig, 'baseUrl', 'https://api.deepseek.com/v1');
                        upd(setLlmConfig, 'model', 'deepseek-chat');
                      } else if (v === 'openai') {
                        upd(setLlmConfig, 'baseUrl', 'https://api.openai.com/v1');
                        upd(setLlmConfig, 'model', 'gpt-4o-mini');
                      } else if (v === 'groq') {
                        upd(setLlmConfig, 'baseUrl', 'https://api.groq.com/openai/v1');
                        upd(setLlmConfig, 'model', 'llama-3.1-70b-versatile');
                      } else if (v === 'auto') {
                        upd(setLlmConfig, 'apiKey', '');
                        upd(setLlmConfig, 'baseUrl', '');
                        upd(setLlmConfig, 'model', '');
                      }
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local (Qwen2.5 3B via llama.cpp)</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">{llmConfig?.provider === 'local' ? 'Uses Qwen2.5 3B running locally on your server — no API key needed' : 'Choose "Local" for the built-in AI, or select an external provider'}</p>
                </div>

                {llmConfig?.provider && llmConfig.provider !== 'auto' && llmConfig.provider !== 'local' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        API Key
                      </Label>
                      <Input
                        className="h-10 font-mono text-sm"
                        type="password"
                        value={llmConfig?.apiKey ?? ''}
                        onChange={(e: any) => upd(setLlmConfig, 'apiKey', e.target.value)}
                        placeholder={llmConfig?.provider === 'deepseek' ? 'sk-...' : 'sk-...'}
                      />
                      {llmConfig?.hasKey && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          API key is configured. Enter a new key to replace it.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Base URL</Label>
                        <Input
                          className="h-10 font-mono text-sm"
                          value={llmConfig?.baseUrl ?? ''}
                          onChange={(e: any) => upd(setLlmConfig, 'baseUrl', e.target.value)}
                          placeholder="https://api.deepseek.com/v1"
                        />
                        <p className="text-[11px] text-muted-foreground">The API endpoint (auto-filled for known providers)</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Model</Label>
                        <Input
                          className="h-10 font-mono text-sm"
                          value={llmConfig?.model ?? ''}
                          onChange={(e: any) => upd(setLlmConfig, 'model', e.target.value)}
                          placeholder="deepseek-chat"
                        />
                        <p className="text-[11px] text-muted-foreground">Model name to use for completions</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                          <p className="font-medium">Important</p>
                          <p className="mt-0.5">Your API key is stored securely and never exposed to clients. When you save, a quick test request is sent to validate the connection. Changing the provider affects all AI features across your platform.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={saveLlm} disabled={llmSaving} className="h-10">
                  {llmSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {llmSaving ? 'Saving & Validating...' : 'Save Provider Settings'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle className="text-lg">Current Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{plan?.name ?? 'Free'}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {currency === 'USD'
                      ? `$${(plan?.priceUsdMonthly ?? 0).toLocaleString()}`
                      : `₦${(plan?.priceNgnMonthly ?? 0).toLocaleString()}`}
                    <span className="text-sm text-muted-foreground font-normal">/month</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-medium">{billing?.subscription?.status ?? 'ACTIVE'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle className="text-lg">Usage This Month</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Products', value: `${usage?.products ?? 0} / ${usage?.maxProducts ?? '∞'}`, color: 'text-orange-600' },
                  { label: 'AI Conversations', value: `${usage?.aiConversations ?? 0} / ${usage?.maxAiConversations ?? '∞'}`, color: 'text-purple-600' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl bg-muted/40">
                    <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Storage usage */}
              <div className="rounded-xl border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    Product Image Storage
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {storageInfo
                      ? `${storageInfo.usedMb < 1 ? (storageInfo.usedMb * 1024).toFixed(1) + ' KB' : storageInfo.usedMb.toFixed(1) + ' MB'} / ${storageInfo.limitMb >= 1024 ? (storageInfo.limitMb / 1024).toFixed(0) + ' GB' : storageInfo.limitMb + ' MB'}`
                      : '— / —'}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (storageInfo?.percentUsed ?? 0) >= 90 ? 'bg-destructive' :
                      (storageInfo?.percentUsed ?? 0) >= 70 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${storageInfo?.percentUsed ?? 0}%` }}
                  />
                </div>
                {storageInfo?.breakdown && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Database: <span className="font-medium text-foreground">{storageInfo.breakdown.database}</span></span>
                    <span>Files: <span className="font-medium text-foreground">{storageInfo.breakdown.files}</span></span>
                  </div>
                )}
                {!storageInfo && <p className="text-xs text-muted-foreground">Loading storage info…</p>}
              </div>
            </CardContent>
          </Card>

          {(billing?.plans ?? []).length > 0 && (
            <Card className="shadow-sm border-border/50">
              <CardHeader><CardTitle className="text-lg">Available Plans</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(billing?.plans ?? []).map((p: any) => {
                    const price = currency === 'USD' ? (p?.priceUsdMonthly ?? 0) : (p?.priceNgnMonthly ?? 0);
                    const currSymbol = currency === 'USD' ? '$' : '₦';
                    const featureItems = p?.features && typeof p.features === 'object'
                      ? Object.entries(p.features).filter(([, v]: any) => v).map(([k, v]: any) => typeof v === 'string' ? v : k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
                      : [];
                    return (
                      <div key={p?.id} className={`p-5 rounded-xl border-2 transition-all ${p?.id === plan?.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/30'}`}>
                        <h4 className="font-bold text-base">{p?.name ?? ''}</h4>
                        <p className="text-2xl font-bold mt-2">
                          {currSymbol}{price.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        </p>
                        {p?.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                          {featureItems.map((f: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />{f}</li>
                          ))}
                        </ul>
                        {p?.id === plan?.id
                          ? <Badge className="mt-4">Current Plan</Badge>
                          : <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => handleUpgrade(p.id)} disabled={upgradingPlan === p.id}>
                              {upgradingPlan === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                              {Number(price) > Number(currency === 'USD' ? (plan?.priceUsdMonthly ?? 0) : (plan?.priceNgnMonthly ?? 0)) ? 'Upgrade' : 'Switch'}
                            </Button>
                        }
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          {/* SEO & Google Shopping Feeds */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5 text-primary" /> Google Shopping &amp; SEO Feeds
              </CardTitle>
              <CardDescription>
                Your products are automatically submitted to Google Shopping via Shopysh's shared merchant feed.
                No setup required — new products appear on Google Shopping within 24 hours of being published.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Global feed — read-only info */}
              <div className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">Shopysh Marketplace Feed (active)</h4>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All your active products are included in the Shopysh Google Merchant Center feed.
                  When customers click your product on Google Shopping they land directly on your store page.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border/60 rounded px-3 py-2 text-muted-foreground truncate select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/feeds/google-merchant` : 'https://www.shopysh.com/feeds/google-merchant'}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/feeds/google-merchant`;
                      navigator.clipboard.writeText(url);
                      toast.success('Feed URL copied');
                    }}
                    className="shrink-0 p-2 rounded-lg border border-border/60 hover:bg-muted transition"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <a
                    href="/feeds/google-merchant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 rounded-lg border border-border/60 hover:bg-muted transition"
                    title="Preview feed"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* Per-merchant feed */}
              {profile?.subdomain && (
                <div className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Your Store Feed (advanced)</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you want your own Google Merchant Center account with your store name on Google Shopping,
                    submit this URL to your own GMC account at{' '}
                    <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      merchants.google.com
                    </a>.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background border border-border/60 rounded px-3 py-2 text-muted-foreground truncate select-all">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/feeds/${profile.subdomain}`
                        : `/feeds/${profile.subdomain}`}
                    </code>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/feeds/${profile.subdomain}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Feed URL copied');
                      }}
                      className="shrink-0 p-2 rounded-lg border border-border/60 hover:bg-muted transition"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <a
                      href={`/feeds/${profile.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 rounded-lg border border-border/60 hover:bg-muted transition"
                      title="Preview feed"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Products must be <strong>active</strong> and have a <strong>price</strong> and at least one <strong>image</strong> to appear on Google Shopping.
                  Google re-fetches the feed every 24 hours.
                </span>
              </div>

            </CardContent>
          </Card>

        </TabsContent>
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> SMS Provider Settings</CardTitle>
              <CardDescription>Configure your SMS provider for campaign broadcasts to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <Select value={smsConfig.provider || 'termii'} onValueChange={(v) => setSmsConfig((prev: any) => ({ ...prev, provider: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termii">Termii</SelectItem>
                    <SelectItem value="africastalking">Africa&apos;s Talking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(smsConfig.provider === 'termii' || !smsConfig.provider) && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm">Termii Configuration</h4>
                  <p className="text-xs text-muted-foreground">Get your API key from <a href="https://accounts.termii.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">accounts.termii.com</a></p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>API Key</Label>
                      <Input type="password" placeholder="TL..." value={smsConfig.termiiApiKey || ''} onChange={(e) => setSmsConfig((prev: any) => ({ ...prev, termiiApiKey: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sender ID</Label>
                      <Input placeholder="e.g. MyStore" value={smsConfig.termiiSenderId || ''} onChange={(e) => setSmsConfig((prev: any) => ({ ...prev, termiiSenderId: e.target.value }))} />
                      <p className="text-xs text-muted-foreground">Your registered sender name (max 11 chars)</p>
                    </div>
                  </div>
                </div>
              )}

              {smsConfig.provider === 'africastalking' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm">Africa&apos;s Talking Configuration</h4>
                  <p className="text-xs text-muted-foreground">Get your credentials from <a href="https://account.africastalking.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">account.africastalking.com</a></p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>API Key</Label>
                      <Input type="password" placeholder="Your API key" value={smsConfig.africastalkingApiKey || ''} onChange={(e) => setSmsConfig((prev: any) => ({ ...prev, africastalkingApiKey: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Username</Label>
                      <Input placeholder="sandbox or production username" value={smsConfig.africastalkingUsername || ''} onChange={(e) => setSmsConfig((prev: any) => ({ ...prev, africastalkingUsername: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender ID (Optional)</Label>
                    <Input placeholder="Your short code or alphanumeric" value={smsConfig.africastalkingSenderId || ''} onChange={(e) => setSmsConfig((prev: any) => ({ ...prev, africastalkingSenderId: e.target.value }))} />
                  </div>
                </div>
              )}

              <EmailTestSection />

              <Button onClick={saveSmsConfig} disabled={smsSaving} className="gap-2">
                {smsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save SMS Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Payment Methods</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Choose which payment options your customers can use at checkout. Only enabled methods will appear on your store.</p>
          </div>

          {/* Pay on Delivery */}
          {(() => {
            const enabled = (paymentConfig.enabledMethods ?? []).includes('pay_on_delivery');
            const toggle = () => setPaymentConfig((prev: any) => ({
              ...prev,
              enabledMethods: enabled
                ? prev.enabledMethods.filter((m: string) => m !== 'pay_on_delivery')
                : [...(prev.enabledMethods ?? []), 'pay_on_delivery'],
            }));
            return (
              <Card className={`shadow-sm transition-all ${enabled ? 'border-primary/40 bg-primary/[0.02]' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Pay on Delivery</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Customer pays cash when their order arrives</CardDescription>
                      </div>
                    </div>
                    <Switch checked={enabled} onCheckedChange={toggle} />
                  </div>
                </CardHeader>
                {enabled && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                      No additional configuration needed. Customers will see this option at checkout.
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })()}

          {/* Bank Transfer */}
          {(() => {
            const enabled = (paymentConfig.enabledMethods ?? []).includes('bank_transfer');
            const toggle = () => setPaymentConfig((prev: any) => ({
              ...prev,
              enabledMethods: enabled
                ? prev.enabledMethods.filter((m: string) => m !== 'bank_transfer')
                : [...(prev.enabledMethods ?? []), 'bank_transfer'],
            }));
            return (
              <Card className={`shadow-sm transition-all ${enabled ? 'border-primary/40 bg-primary/[0.02]' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Bank Transfer</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Customer transfers to your bank account before delivery</CardDescription>
                      </div>
                    </div>
                    <Switch checked={enabled} onCheckedChange={toggle} />
                  </div>
                </CardHeader>
                {enabled && (
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">Your bank details will be shown to the customer at checkout.</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bank Name</Label>
                        <Input placeholder="e.g. GTBank" value={paymentConfig.bankName || ''} onChange={(e) => setPaymentConfig((prev: any) => ({ ...prev, bankName: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Number</Label>
                        <Input placeholder="0123456789" value={paymentConfig.accountNumber || ''} onChange={(e) => setPaymentConfig((prev: any) => ({ ...prev, accountNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Account Name</Label>
                        <Input placeholder="Business name" value={paymentConfig.accountName || ''} onChange={(e) => setPaymentConfig((prev: any) => ({ ...prev, accountName: e.target.value }))} />
                      </div>
                    </div>
                    {enabled && (!paymentConfig.bankName || !paymentConfig.accountNumber || !paymentConfig.accountName) && (
                      <p className="text-xs text-amber-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Fill in all bank details so customers can make transfers.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })()}

          {/* Mobile Money */}
          {(() => {
            const enabled = (paymentConfig.enabledMethods ?? []).includes('mobile_money');
            const toggle = () => setPaymentConfig((prev: any) => ({
              ...prev,
              enabledMethods: enabled
                ? prev.enabledMethods.filter((m: string) => m !== 'mobile_money')
                : [...(prev.enabledMethods ?? []), 'mobile_money'],
            }));
            return (
              <Card className={`shadow-sm transition-all ${enabled ? 'border-primary/40 bg-primary/[0.02]' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Mobile Money</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Opay, Palmpay, Kuda, MTN MoMo, etc.</CardDescription>
                      </div>
                    </div>
                    <Switch checked={enabled} onCheckedChange={toggle} />
                  </div>
                </CardHeader>
                {enabled && (
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">Provide payment instructions shown to the customer at checkout.</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Payment Instructions</Label>
                      <Textarea
                        placeholder="e.g. Send payment to 08012345678 on Opay (Business Name). Send screenshot to us on WhatsApp after payment."
                        rows={3}
                        value={paymentConfig.mobileMoneyInstructions || ''}
                        onChange={(e) => setPaymentConfig((prev: any) => ({ ...prev, mobileMoneyInstructions: e.target.value }))}
                      />
                    </div>
                    {enabled && !paymentConfig.mobileMoneyInstructions && (
                      <p className="text-xs text-amber-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Add payment instructions so customers know where to send money.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })()}

          {(paymentConfig.enabledMethods ?? []).length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No payment method enabled. Customers will not be able to complete checkout until you enable at least one.
            </p>
          )}

          <Button onClick={savePaymentConfig} disabled={paymentSaving} className="gap-2">
            {paymentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Payment Settings
          </Button>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-6 space-y-6">
          {/* GL Posting Mode */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> GL Posting Mode</CardTitle>
              <CardDescription>
                Choose how journal entries are posted to the General Ledger.
                <strong> Auto</strong> posts immediately when a transaction is recorded.
                <strong> End-of-Day (EOD)</strong> saves transactions as DRAFT until you run the EOD process from the Finance dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {(['AUTO', 'EOD'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFinanceConfig((prev: any) => ({ ...prev, glPostingMode: mode }))}
                    className={`flex-1 max-w-xs py-4 px-5 rounded-xl border-2 text-left transition-all ${
                      financeConfig.glPostingMode === mode
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-muted-foreground/30'
                    }`}
                  >
                    <p className="font-semibold text-sm">{mode === 'AUTO' ? 'Auto-Post' : 'End-of-Day (EOD)'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mode === 'AUTO'
                        ? 'Transactions post to GL immediately on save'
                        : 'Transactions stay as DRAFT until you run EOD from the Finance dashboard'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* GL Account Mappings — Transaction Journal Patterns */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Journal Mappings</CardTitle>
              <CardDescription>
                For each transaction type, select the account to <strong>Debit (DR)</strong> and the account to <strong>Credit (CR)</strong>.
                Accounts showing "Default" are system presets — select a different account to override.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {glAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No GL accounts found. Set up your Chart of Accounts in Finance → Chart of Accounts first.
                </p>
              ) : (() => {
                const leafAccounts = glAccounts.filter((a: any) => !a.parentId || a._count?.children === 0);

                const glSelect = (tag: string, defaultCode: string, defaultName: string) => (
                  <Select
                    value={financeConfig.glAccountMappings?.[tag] ?? '__none__'}
                    onValueChange={v => setFinanceConfig((prev: any) => ({
                      ...prev,
                      glAccountMappings: { ...(prev.glAccountMappings ?? {}), [tag]: v === '__none__' ? undefined : v },
                    }))}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs w-full">
                      <SelectValue placeholder={`[${defaultCode}] ${defaultName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Default: [{defaultCode}] {defaultName}</SelectItem>
                      {leafAccounts.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>[{a.code}] {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );

                const fixedCell = (code: string, name: string) => (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">[{code}]</span>{name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">system fixed</span>
                  </div>
                );

                // Two selects stacked — used when the CR account depends on payment method
                const dualCashBankSelect = () => (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">Cash:</span>
                      {glSelect('CASH', '1110', 'Cash on Hand')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground shrink-0 w-14 text-right">Bank:</span>
                      {glSelect('BANK', '1120', 'Cash at Bank')}
                    </div>
                  </div>
                );

                const GROUPS = [
                  {
                    title: 'Sales & Receipts',
                    rows: [
                      { event: 'Cash Sale / Cash Payment', note: 'Customer pays cash at point of sale',
                        dr: glSelect('CASH', '1110', 'Cash on Hand'),
                        cr: glSelect('SALES', '4100', 'Sales Revenue') },
                      { event: 'Bank Transfer / Mobile Money Payment', note: 'Customer pays by bank transfer or mobile money',
                        dr: glSelect('BANK', '1120', 'Cash at Bank'),
                        cr: glSelect('SALES', '4100', 'Sales Revenue') },
                      { event: 'Invoice / Credit Sale', note: 'Customer invoice raised; payment expected later',
                        dr: glSelect('AR', '1200', 'Accounts Receivable'),
                        cr: glSelect('SALES', '4100', 'Sales Revenue') },
                      { event: 'Output VAT on Sales', note: 'VAT portion split from the invoice credit',
                        dr: glSelect('AR', '1200', 'Accounts Receivable'),
                        cr: glSelect('VAT_OUTPUT', '2200', 'Output VAT Payable') },
                    ],
                  },
                  {
                    title: 'Purchases & Payables',
                    rows: [
                      { event: 'Purchase on Credit', note: 'Goods or services received from a supplier on account',
                        dr: glSelect('PURCHASE', '5100', 'Cost of Goods Sold'),
                        cr: glSelect('AP', '2110', 'Accounts Payable') },
                    ],
                  },
                  {
                    title: 'Expenses',
                    rows: [
                      { event: 'Expense Recording', note: 'Credit is Cash on Hand or Cash at Bank — chosen by payment method when recording the expense',
                        dr: glSelect('EXPENSE', '6800', 'Miscellaneous Expenses'),
                        cr: dualCashBankSelect() },
                    ],
                  },
                  {
                    title: 'Inventory & Cost of Sales',
                    rows: [
                      { event: 'Cost of Goods Sold (COGS)', note: 'Auto-posted when a tracked-inventory order is fulfilled',
                        dr: glSelect('COGS', '5100', 'Cost of Goods Sold'),
                        cr: glSelect('INVENTORY', '1300', 'Inventory') },
                    ],
                  },
                  {
                    title: 'Fixed Assets',
                    rows: [
                      { event: 'Fixed Asset Acquisition', note: 'Credit is Cash on Hand or Cash at Bank — chosen by payment method when the asset is recorded. Per-category DR overrides in the section below.',
                        dr: glSelect('FIXED_ASSET', '1610', 'Property & Equipment'),
                        cr: dualCashBankSelect() },
                      { event: 'Asset Depreciation', note: 'Monthly depreciation charge — accounts are system-fixed and cannot be changed here',
                        dr: fixedCell('6700', 'Depreciation Expense'),
                        cr: fixedCell('1700', 'Accumulated Depreciation') },
                    ],
                  },
                ];

                return (
                  <div className="space-y-5">
                    {/* Column header */}
                    <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 pb-2 border-b border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction Type</div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">DR</span>
                        Debit Account
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">CR</span>
                        Credit Account
                      </div>
                    </div>

                    {GROUPS.map(group => (
                      <div key={group.title} className="space-y-0">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-1">{group.title}</p>
                        {group.rows.map((row, i) => (
                          <div key={row.event} className={`grid grid-cols-[1.4fr_1fr_1fr] gap-3 py-2.5 items-center ${i < group.rows.length - 1 ? 'border-b border-border/30' : ''}`}>
                            <div>
                              <p className="text-sm font-medium leading-snug">{row.event}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{row.note}</p>
                            </div>
                            <div>{row.dr}</div>
                            <div>{row.cr}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Fixed Asset Category GL Mappings */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Fixed Asset Category GL Accounts</CardTitle>
              <CardDescription>
                Assign a specific GL account to each fixed asset category. This overrides the "Default Fixed Asset" mapping above
                for assets of that category, but is overridden by the GL account set directly on an individual asset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {glAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No GL accounts found. Set up your Chart of Accounts in Finance → Chart of Accounts first.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 pr-4 w-1/3">Asset Category</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">GL Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Land & Buildings', 'Plant & Machinery', 'Motor Vehicles',
                        'Furniture & Fittings', 'Computer Equipment', 'Office Equipment',
                        'Tools & Equipment', 'Leasehold Improvements', 'Other',
                      ].map(cat => (
                        <tr key={cat} className="border-b border-border/40">
                          <td className="py-3 pr-4 font-medium">{cat}</td>
                          <td className="py-3">
                            <Select
                              value={financeConfig.fixedAssetCategoryMappings?.[cat] ?? '__none__'}
                              onValueChange={v => setFinanceConfig((prev: any) => ({
                                ...prev,
                                fixedAssetCategoryMappings: { ...(prev.fixedAssetCategoryMappings ?? {}), [cat]: v === '__none__' ? undefined : v },
                              }))}
                            >
                              <SelectTrigger className="h-9 rounded-xl text-sm">
                                <SelectValue placeholder="Use default fixed asset account" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Use default fixed asset account</SelectItem>
                                {glAccounts
                                  .filter((a: any) => !a.parentId || a._count?.children === 0)
                                  .map((a: any) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      [{a.code}] {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveFinanceConfig} disabled={financeSaving} className="gap-2">
              {financeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Finance Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}