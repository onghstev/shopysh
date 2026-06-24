'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, ArrowRight, ShieldCheck, Zap, BarChart3,
  Sparkles, MessageSquare, ShoppingBag, TrendingUp, Bot,
} from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  {
    icon: Bot,
    title: 'Conversational AI',
    desc: 'Automate customer conversations and take orders 24/7 via smart chat widget',
  },
  {
    icon: ShoppingBag,
    title: 'Smart Product Discovery',
    desc: 'AI-guided shopping experiences that surface the right products at the right time',
  },
  {
    icon: MessageSquare,
    title: 'Automated Engagement',
    desc: 'Campaigns, follow-ups, and customer messaging — all on autopilot',
  },
  {
    icon: TrendingUp,
    title: 'Business Analytics',
    desc: 'Real-time revenue tracking, growth metrics and actionable insights',
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Bank-grade security' },
  { icon: Sparkles, label: 'Private, self-hosted AI' },
  { icon: BarChart3, label: 'Built for African SMEs' },
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
          router.replace(session?.user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
        } catch {
          router.replace('/dashboard');
        }
      }
    } catch {
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

      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden sidebar-gradient">

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-gold/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-white/[0.04] rounded-full blur-[90px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gold/[0.04] rounded-full blur-[80px]" />
        </div>

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15 shadow-[0_0_20px_rgba(255,255,255,0.08)]">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <span className="font-display font-bold text-white text-xl tracking-tight">SHOPYSH</span>
          </div>

          {/* Main copy */}
          <div className="space-y-10 max-w-lg">
            <div>
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.10] text-xs font-semibold text-gold/90 mb-7 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                AI-Powered Commerce Platform
              </div>

              {/* Headline */}
              <h1 className="text-4xl xl:text-[2.75rem] font-display font-bold text-white leading-[1.12] tracking-tight">
                Intelligent Shopping<br />
                Experiences for<br />
                <span className="bg-gradient-to-r from-gold via-amber-300 to-gold bg-clip-text text-transparent">
                  Growing Businesses
                </span>
              </h1>

              {/* Tagline / brand description */}
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
                <p className="text-white/75 text-sm leading-relaxed">
                  <span className="font-semibold text-white/95">Shopysh</span>{' '}
                  <span className="text-gold/80 font-medium text-xs">(Shop + Your Smart Hub)</span>{' '}
                  is an AI-powered commerce platform that helps businesses create intelligent shopping
                  experiences through conversational AI, smart product discovery, and automated
                  customer engagement.
                </p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.11] transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <f.icon className="w-[17px] h-[17px] text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{f.title}</p>
                    <p className="text-[12.5px] leading-relaxed mt-0.5 text-white/45">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/40 text-xs pt-6 border-t border-white/[0.07]">
            {TRUST_BADGES.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <b.icon className="w-3.5 h-3.5 text-gold/60" />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-[400px] space-y-7">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-foreground">SHOPYSH</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Shop + Your Smart Hub</p>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Sign in to your business dashboard</p>
          </div>

          {/* Google SSO */}
          <Button
            variant="outline"
            className="w-full h-11 text-sm font-medium border-border/60 hover:bg-accent hover:border-primary/30 rounded-xl shadow-sm transition-all"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground/50 font-medium tracking-wider">or sign in with email</span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e: any) => setEmail(e?.target?.value ?? '')}
                className="h-11 rounded-xl bg-secondary/50 border-border/60 focus:bg-background transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="#" className="text-xs text-primary hover:text-gold transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: any) => setPassword(e?.target?.value ?? '')}
                className="h-11 rounded-xl bg-secondary/50 border-border/60 focus:bg-background transition-colors"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-gold font-semibold transition-colors">
              Create one free
            </Link>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Have an access code?{' '}
            <Link href="/signup/code" className="text-gold hover:text-primary font-semibold transition-colors">
              Sign up with secure code
            </Link>
          </p>

          {/* Mobile tagline */}
          <p className="lg:hidden text-center text-[11px] text-muted-foreground/50 leading-relaxed pt-2 border-t border-border/40">
            Shopysh (Shop + Your Smart Hub) — AI-powered commerce for growing businesses.
          </p>
        </div>
      </div>
    </div>
  );
}
