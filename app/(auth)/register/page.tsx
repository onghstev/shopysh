'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ShieldCheck, Zap, BarChart3, Sparkles, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  { icon: Sparkles, title: 'AI Chat Assistant', desc: 'Automate conversations & take orders 24/7 via chat widget' },
  { icon: Zap, title: 'Smart Automation', desc: 'AI-powered responses, order tracking & customer management' },
  { icon: BarChart3, title: 'Business Analytics', desc: 'Real-time insights, revenue tracking & growth metrics' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Accept payments via Paystack & Flutterwave seamlessly' },
];

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const upd = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length;

  const strengthColor = passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-amber-500' : passwordStrength === 4 ? 'bg-yellow-400' : 'bg-green-500';
  const strengthLabel = passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Fair' : passwordStrength === 4 ? 'Good' : 'Strong';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, email, password, confirmPassword, businessName } = form;

    if (!firstName || !email || !password || !businessName) {
      toast.error('Please fill all required fields'); return;
    }
    if (PASSWORD_RULES.some(r => !r.test(password))) {
      toast.error('Password does not meet the requirements below'); return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          businessName: form.businessName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Registration failed'); return; }
      toast.success('Account created! Signing you in...');
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) {
        router.replace('/login');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn('google', { redirect: true, callbackUrl: '/onboarding' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden sidebar-gradient">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-emerald-400/[0.07] rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-amber-300/[0.05] rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 backdrop-blur flex items-center justify-center ring-1 ring-white/10">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">SHOPYSH</span>
          </div>

          <div className="space-y-10 max-w-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-emerald-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Start Your Free Trial
              </div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-[1.15] tracking-tight">
                Start Growing Your<br />Business With<br />
                <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">AI Automation</span>
              </h1>
              <p className="mt-5 text-white/50 text-base xl:text-lg leading-relaxed">
                Join hundreds of African businesses already using AI to automate sales, support, and marketing.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-[18px] h-[18px] text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{f.title}</p>
                    <p className="text-[13px] leading-relaxed mt-0.5 text-white/40">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">Free 14-day trial • No credit card required</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-6 py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SHOPYSH</span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground mt-1 text-sm">Get started with your AI business assistant</p>
          </div>

          {/* Google SSO */}
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium border-border/50 hover:bg-muted/40 rounded-xl shadow-sm"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
              <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground/60 font-medium">or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">First Name <span className="text-destructive">*</span></Label>
                <Input className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background" placeholder="John" value={form.firstName} onChange={(e: any) => upd('firstName', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Last Name</Label>
                <Input className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background" placeholder="Doe" value={form.lastName} onChange={(e: any) => upd('lastName', e.target.value)} />
              </div>
            </div>

            {/* Business name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Business Name <span className="text-destructive">*</span></Label>
              <Input className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background" placeholder="My Business" value={form.businessName} onChange={(e: any) => upd('businessName', e.target.value)} required />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></Label>
              <Input className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background" type="email" placeholder="you@business.com" value={form.email} onChange={(e: any) => upd('email', e.target.value)} required />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e: any) => upd('password', e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {(passwordFocused || form.password.length > 0) && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(passwordStrength / PASSWORD_RULES.length) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-medium ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-amber-500' : passwordStrength === 4 ? 'text-yellow-500' : 'text-green-600'}`}>
                      {form.password.length > 0 ? strengthLabel : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {PASSWORD_RULES.map((rule, i) => {
                      const passed = rule.test(form.password);
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          {passed
                            ? <Check className="w-3 h-3 text-green-600 shrink-0" />
                            : <X className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                          <span className={`text-[11px] ${passed ? 'text-green-700 dark:text-green-500' : 'text-muted-foreground'}`}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  className={`h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background pr-10 ${
                    form.confirmPassword.length > 0 && form.confirmPassword !== form.password
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e: any) => upd('confirmPassword', e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword.length > 0 && form.confirmPassword !== form.password && (
                <p className="text-[11px] text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {form.confirmPassword.length > 0 && form.confirmPassword === form.password && (
                <p className="text-[11px] text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
