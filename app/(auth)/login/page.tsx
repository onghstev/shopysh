'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ShieldCheck, Zap, BarChart3, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  { icon: Sparkles, title: 'AI Chat Assistant', desc: 'Automate conversations & take orders 24/7 via chat widget' },
  { icon: Zap, title: 'Smart Automation', desc: 'AI-powered responses, order tracking & customer management' },
  { icon: BarChart3, title: 'Business Analytics', desc: 'Real-time insights, revenue tracking & growth metrics' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Accept payments via Paystack & Flutterwave seamlessly' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        toast.error(result.error);
      } else {
        try {
          const sessionRes = await fetch('/api/auth/session');
          const session = await sessionRes.json();
          if (session?.user?.role === 'SUPER_ADMIN') {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        } catch {
          router.replace('/dashboard');
        }
      }
    } catch (err: any) {
      toast.error('Login failed');
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
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-emerald-400/[0.07] rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-amber-300/[0.05] rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] bg-white/[0.03] rounded-full blur-[60px]" />
        </div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 backdrop-blur flex items-center justify-center ring-1 ring-white/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">SHOPYSH</span>
          </div>

          <div className="space-y-10 max-w-lg">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-emerald-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered Business Platform
              </div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-[1.15] tracking-tight">
                Your AI-Powered<br />Business Management<br />
                <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">Assistant</span>
              </h1>
              <p className="mt-5 text-white/50 text-base xl:text-lg leading-relaxed">
                Manage orders, engage customers, and grow your business — all powered by artificial intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.05] transition-colors duration-300">
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

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/40 text-xs">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-300/70" /> Bank-grade security</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-300/70" /> Private, self-hosted AI</span>
            <span className="inline-flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-emerald-300/70" /> Built for African SMEs</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">SHOPYSH</span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-sm">Sign in to your business dashboard</p>
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
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground/60 font-medium">or sign in with email</span></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: any) => setPassword(e?.target?.value ?? '')}
                className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
