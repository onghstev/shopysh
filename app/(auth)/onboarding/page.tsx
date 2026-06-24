'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare, ArrowRight, ArrowLeft, Building2, CreditCard,
  Check, Loader2, Sparkles, Users, Database, Headphones, Zap,
  Landmark, Globe, Copy, CheckCircle, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

const INDUSTRIES = [
  'Retail / E-commerce', 'Food & Beverages', 'Fashion & Beauty',
  'Health & Wellness', 'Technology / IT Services', 'Education',
  'Real Estate', 'Agriculture', 'Transportation & Logistics',
  'Financial Services', 'Manufacturing', 'Media & Entertainment',
  'Hospitality & Tourism', 'Professional Services', 'Other',
];

const STEP_LABELS_NORMAL = ['Business Info', 'Choose Plan', 'Payment Method', 'Confirm'];
const STEP_LABELS_CODE   = ['Business Info', 'Plan (Activated)', 'Confirm'];

const BANK_DETAILS = {
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountName: 'Tekhuna Technologies Ltd',
  accountNumber: '0123456789',
  sortCode: '058-XXXXXX',
  narration: 'Tekhuna Biz AI Subscription',
};

interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceNgnMonthly: number;
  priceNgnYearly: number;
  priceUsdMonthly: number;
  priceUsdYearly: number;
  features: Record<string, string>;
  maxAiConversations: number;
  maxProducts: number;
  maxUsers: number;
  maxStorageGb: number;
  maxBroadcastsMonthly: number;
  apiAccess: boolean;
  customAiTraining: boolean;
  prioritySupport: boolean;
}

function OnboardingPageInner() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('code') ?? '';
  const usingCode = Boolean(accessCode);

  const STEP_LABELS = usingCode ? STEP_LABELS_CODE : STEP_LABELS_NORMAL;

  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank_transfer' | ''>('');
  const [copiedField, setCopiedField] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Nigeria',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      setForm((prev) => ({
        ...prev,
        businessName: prev.businessName || u.tenantName || '',
        email: prev.email || u.email || '',
      }));
    }
  }, [session]);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch('/api/onboarding/plans');
      const data = await res.json();
      if (data.plans) {
        const mapped = data.plans.map((p: any) => ({
          ...p,
          priceNgnMonthly: Number(p.priceNgnMonthly),
          priceNgnYearly: Number(p.priceNgnYearly),
          priceUsdMonthly: Number(p.priceUsdMonthly),
          priceUsdYearly: Number(p.priceUsdYearly),
        }));
        setPlans(mapped);
      }
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Verify access code and pre-select plan
  useEffect(() => {
    if (!accessCode || plans.length === 0) return;
    fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: accessCode }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid && data.plan) {
          setSelectedPlanId(data.plan.id);
          if (data.billingCycle) setBillingCycle(data.billingCycle);
          setCodeVerified(true);
        } else {
          toast.error('Access code is invalid or expired. Please select a plan manually.');
        }
      })
      .catch(() => toast.error('Could not verify access code'));
  }, [accessCode, plans]);

  // Check if already onboarded
  useEffect(() => {
    if (status !== 'authenticated') return;
    setCheckingStatus(true);
    fetch('/api/onboarding/complete').then(r => r.json()).then(data => {
      if (data.onboardingComplete) router.replace('/dashboard');
    }).catch(() => {}).finally(() => setCheckingStatus(false));
  }, [status, router]);

  const upd = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const validateStep0 = () => {
    if (!form.businessName.trim()) { toast.error('Business name is required'); return false; }
    if (!form.industry) { toast.error('Please select your industry'); return false; }
    return true;
  };

  const validateStep1 = () => {
    if (!selectedPlanId) { toast.error('Please select a plan'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!paymentMethod) { toast.error('Please select a payment method'); return false; }
    return true;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(''), 2000);
    }).catch(() => toast.error('Failed to copy'));
  };

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    // Skip payment method step (step 2) when using an access code
    if (!usingCode && step === 2 && !validateStep2()) return;
    const maxStep = usingCode ? 2 : 3;
    setStep((s) => Math.min(s + 1, maxStep));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          planId: selectedPlanId,
          billingCycle,
          paymentMethod: usingCode ? 'access_code' : paymentMethod,
          ...(usingCode ? { accessCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to complete setup');
        return;
      }
      toast.success('Setup complete! Welcome aboard \ud83c\udf89');
      router.replace('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');

  const formatPrice = (ngnAmount: number, usdAmount: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(usdAmount);
    }
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(ngnAmount);
  };

  const formatNgn = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Top bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base tracking-tight">TEKHUNA BIZ AI</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px bg-border" />}
                <div className={`flex items-center gap-1.5 ${
                  i < step ? 'text-primary' : i === step ? 'text-foreground font-medium' : ''
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Step 0: Business Info */}
        {step === 0 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Tell us about your business</h1>
              <p className="text-muted-foreground">This helps us customize your AI assistant experience</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Name *</Label>
                  <Input
                    className="h-11"
                    placeholder="e.g. Ada's Fashion Store"
                    value={form.businessName}
                    onChange={(e: any) => upd('businessName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Industry *</Label>
                  <Select value={form.industry} onValueChange={(v) => upd('industry', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <Input
                      className="h-11"
                      placeholder="+234 800 000 0000"
                      value={form.phone}
                      onChange={(e: any) => upd('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Business Email</Label>
                    <Input
                      className="h-11"
                      type="email"
                      placeholder="hello@business.com"
                      value={form.email}
                      onChange={(e: any) => upd('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <Input
                    className="h-11"
                    placeholder="Street address"
                    value={form.address}
                    onChange={(e: any) => upd('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">City</Label>
                    <Input
                      className="h-11"
                      placeholder="Lagos"
                      value={form.city}
                      onChange={(e: any) => upd('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Country</Label>
                    <Input
                      className="h-11"
                      placeholder="Nigeria"
                      value={form.country}
                      onChange={(e: any) => upd('country', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={nextStep} className="h-11 px-8 font-medium">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Plan Selection */}
        {step === 1 && usingCode && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Plan activated by code</h1>
              <p className="text-muted-foreground">Your access code pre-activates the following subscription</p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-accent border border-primary/20">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Code verified</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{accessCode}</p>
                  </div>
                </div>
                {selectedPlan ? (
                  <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{selectedPlan.name} Plan</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold capitalize">{billingCycle}</span>
                    </div>
                    {selectedPlan.description && <p className="text-sm text-muted-foreground mb-3">{selectedPlan.description}</p>}
                    <p className="text-xs text-muted-foreground">No payment required — your plan is covered by the access code.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading plan details…</p>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="h-11">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={nextStep} className="h-11 px-8 font-medium" disabled={!selectedPlanId}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && !usingCode && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Choose your plan</h1>
              <p className="text-muted-foreground">All plans include a 14-day free trial</p>
            </div>

            {/* Billing & Currency toggles */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="ml-1.5 text-xs opacity-80">(Save ~17%)</span>
                </button>
              </div>
              <div className="h-5 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrency('NGN')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currency === 'NGN'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ₦ NGN
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currency === 'USD'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => {
                  const ngnPrice = billingCycle === 'yearly' ? plan.priceNgnYearly : plan.priceNgnMonthly;
                  const usdPrice = billingCycle === 'yearly' ? plan.priceUsdYearly : plan.priceUsdMonthly;
                  const isSelected = selectedPlanId === plan.id;
                  const isPopular = plan.name === 'Business';

                  return (
                    <Card
                      key={plan.id}
                      className={`relative cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
                          : 'hover:shadow-md hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">{plan.description}</CardDescription>
                        <div className="pt-2">
                          <span className="text-3xl font-bold font-display">{formatPrice(ngnPrice, usdPrice)}</span>
                          <span className="text-muted-foreground text-sm ml-1">
                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(plan.features as Record<string, any>).filter(([, v]) => v).map(([key, value], fi) => (
                          <div key={fi} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{typeof value === 'string' ? value : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                          </div>
                        ))}

                        <div className="pt-3 space-y-1.5 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{plan.maxUsers} user{plan.maxUsers > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="w-3.5 h-3.5" />
                            <span>{plan.maxStorageGb}GB storage</span>
                          </div>
                          {plan.prioritySupport && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Headphones className="w-3.5 h-3.5" />
                              <span>Priority support</span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className="w-full mt-3 h-10 font-medium"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setSelectedPlanId(plan.id);
                          }}
                        >
                          {isSelected ? (
                            <><Check className="w-4 h-4 mr-2" /> Selected</>
                          ) : (
                            'Select Plan'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Enterprise callout */}
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">Need a plan higher than Premium?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For enterprise-level needs with custom limits, dedicated support, and tailored features — contact Tekhuna Technologies for a bespoke setup.
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:hello@tekhuna.com?subject=Enterprise%20Plan%20Inquiry"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="text-xs font-medium">
                    Contact Tekhuna
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep} className="h-11 font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep} className="h-11 px-8 font-medium" disabled={!selectedPlanId}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method (normal flow only) */}
        {step === 2 && !usingCode && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">How would you like to pay?</h1>
              <p className="text-muted-foreground">Choose your preferred payment method after your free trial ends</p>
            </div>

            {/* Payment method cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Online Payment */}
              <Card
                className={`relative cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'online'
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
                    : 'hover:shadow-md hover:border-primary/30'
                }`}
                onClick={() => setPaymentMethod('online')}
              >
                <CardContent className="pt-6 pb-5 flex flex-col items-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'online' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">Pay Online</p>
                    <p className="text-xs text-muted-foreground mt-1">Paystack, Flutterwave, or card</p>
                  </div>
                  {paymentMethod === 'online' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Transfer */}
              <Card
                className={`relative cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'bank_transfer'
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
                    : 'hover:shadow-md hover:border-primary/30'
                }`}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                <CardContent className="pt-6 pb-5 flex flex-col items-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'bank_transfer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground mt-1">Direct bank deposit or transfer</p>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank_transfer' && (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-primary" />
                    Bank Transfer Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Use these details to make your payment after the trial period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Bank Name', value: BANK_DETAILS.bankName, key: 'bankName' },
                    { label: 'Account Name', value: BANK_DETAILS.accountName, key: 'accountName' },
                    { label: 'Account Number', value: BANK_DETAILS.accountNumber, key: 'accountNumber' },
                    { label: 'Sort Code', value: BANK_DETAILS.sortCode, key: 'sortCode' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg bg-background border">
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium font-mono">{item.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          copyToClipboard(item.value, item.key);
                        }}
                      >
                        {copiedField === item.key ? (
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}

                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Payment Reference:</strong> Use your business email as the payment narration/reference so we can match your payment. Your subscription will be activated within 24 hours of confirmation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Online payment note */}
            {paymentMethod === 'online' && (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Online Payment</p>
                      <p className="text-xs text-muted-foreground">
                        After your 14-day free trial, you&apos;ll be prompted to pay securely via Paystack or Flutterwave. We accept Visa, Mastercard, bank transfers via Paystack, and mobile money.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep} className="h-11 font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep} className="h-11 px-8 font-medium" disabled={!paymentMethod}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation (normal) or Step 2: Confirmation (code path) */}
        {(step === 3 || (usingCode && step === 2)) && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Confirm your setup</h1>
              <p className="text-muted-foreground">Review your details and get started</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Business Name</span>
                  <span className="font-medium">{form.businessName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{form.industry}</span>
                </div>
                {form.phone && (
                  <div className="flex justify-between py-1.5 border-b border-dashed">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{form.phone}</span>
                  </div>
                )}
                {form.email && (
                  <div className="flex justify-between py-1.5 border-b border-dashed">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{form.email}</span>
                  </div>
                )}
                {(form.city || form.country) && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{[form.city, form.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Selected Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPlan && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-bold text-lg">{selectedPlan.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg">
                          {formatPrice(
                            billingCycle === 'yearly' ? selectedPlan.priceNgnYearly : selectedPlan.priceNgnMonthly,
                            billingCycle === 'yearly' ? selectedPlan.priceUsdYearly : selectedPlan.priceUsdMonthly
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">/{billingCycle === 'yearly' ? 'year' : 'month'}</p>
                      </div>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 flex items-start gap-2">
                      <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Start with a <strong className="text-foreground">14-day free trial</strong>. You won&apos;t be charged until the trial ends.
                      </p>
                    </div>
                    <div className="flex justify-between py-1.5 border-t pt-3 mt-2">
                      <span className="text-sm text-muted-foreground">Payment Method</span>
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {paymentMethod === 'bank_transfer' ? (
                          <><Landmark className="w-3.5 h-3.5" /> Bank Transfer</>
                        ) : (
                          <><Globe className="w-3.5 h-3.5" /> Online Payment</>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prevStep} className="h-11 font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleComplete}
                className="h-11 px-8 font-medium"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete Setup & Start Trial
                {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingPageInner />
    </Suspense>
  );
}
