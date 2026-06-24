'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ArrowLeft, KeyRound, CheckCircle, Sparkles, ShieldCheck, Package } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'enter-code' | 'create-account';

interface CodeInfo {
  code: string;
  plan: { id: string; name: string; description: string | null };
  billingCycle: string;
  note: string | null;
}

export default function SignupWithCodePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('enter-code');
  const [code, setCode] = useState('');
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', tenantName: '' });

  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleVerifyCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error('Please enter your access code'); return; }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Invalid code'); return; }
      setCodeInfo(data);
      setCode(trimmed);
      setStep('create-account');
    } catch {
      toast.error('Failed to verify code');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.tenantName) {
      toast.error('Please fill all fields'); return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setRegistering(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          tenantName: form.tenantName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Registration failed'); return; }

      // Sign in and redirect to onboarding with the access code
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) { toast.error('Account created but login failed. Please log in manually.'); router.push('/login'); return; }
      router.replace(`/onboarding?code=${encodeURIComponent(codeInfo!.code)}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden sidebar-gradient">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-gold/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[360px] h-[360px] bg-white/[0.04] rounded-full blur-[90px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }}
        />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <span className="font-display font-bold text-white text-xl tracking-tight">SHOPYSH</span>
          </div>

          <div className="space-y-8 max-w-sm">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.10] text-xs font-semibold text-gold/90 mb-6 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Secure Code Signup
              </div>
              <h1 className="text-3xl xl:text-4xl font-display font-bold text-white leading-[1.15] tracking-tight">
                You have been<br />
                <span className="bg-gradient-to-r from-gold via-amber-300 to-gold bg-clip-text text-transparent">
                  invited to join
                </span>
              </h1>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">
                Your access code grants you a pre-configured subscription plan. Enter it to get started — no payment required.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: KeyRound, text: 'Enter your unique access code' },
                { icon: CheckCircle, text: 'Your plan is pre-activated' },
                { icon: Package, text: 'Complete business setup' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-white/40 text-xs pt-6 border-t border-white/[0.07]">
            <ShieldCheck className="w-3.5 h-3.5 text-gold/60" />
            Codes are single-use and verified by Shopysh
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-[400px] space-y-7">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SHOPYSH</span>
          </div>

          {step === 'enter-code' && (
            <>
              <div>
                <h2 className="text-2xl font-display font-bold tracking-tight">Enter access code</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Your code was provided by the Shopysh team after payment confirmation.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Access Code</Label>
                  <Input
                    placeholder="SHP-XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                    className="h-12 rounded-xl font-mono text-base tracking-widest bg-secondary/50 border-border/60 focus:bg-background text-center uppercase"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">Format: SHP-XXXX-XXXX-XXXX</p>
                </div>

                <Button
                  onClick={handleVerifyCode}
                  className="w-full h-11 font-semibold rounded-xl"
                  disabled={verifying || !code.trim()}
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  Verify Code
                </Button>
              </div>
            </>
          )}

          {step === 'create-account' && codeInfo && (
            <>
              <div>
                <button onClick={() => setStep('enter-code')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change code
                </button>

                {/* Code confirmed banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-accent border border-primary/20 mb-5">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Code verified!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono font-bold text-primary">{codeInfo.code}</span>
                      {' — '}{codeInfo.plan.name} plan ({codeInfo.billingCycle})
                    </p>
                    {codeInfo.note && <p className="text-xs text-muted-foreground mt-0.5 italic">Note: {codeInfo.note}</p>}
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold tracking-tight">Create your account</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">Your {codeInfo.plan.name} plan will be activated automatically.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Name</Label>
                  <Input
                    placeholder="Ada's Fashion Store"
                    value={form.tenantName}
                    onChange={(e) => upd('tenantName', e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 border-border/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Full Name</Label>
                  <Input
                    placeholder="Ada Okonkwo"
                    value={form.name}
                    onChange={(e) => upd('name', e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 border-border/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={(e) => upd('email', e.target.value)}
                    className="h-11 rounded-xl bg-secondary/50 border-border/60"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <Input
                      type="password"
                      placeholder="Min 8 chars"
                      value={form.password}
                      onChange={(e) => upd('password', e.target.value)}
                      className="h-11 rounded-xl bg-secondary/50 border-border/60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Confirm</Label>
                    <Input
                      type="password"
                      placeholder="Repeat"
                      value={form.confirmPassword}
                      onChange={(e) => upd('confirmPassword', e.target.value)}
                      className="h-11 rounded-xl bg-secondary/50 border-border/60"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                  disabled={registering}
                >
                  {registering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account & Continue
                  {!registering && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-gold font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
