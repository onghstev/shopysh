'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User, LogOut, Package, ShoppingBag, Clock, CheckCircle, Truck,
  XCircle, Loader2, ChevronRight, Store, ArrowLeft, Eye, Sparkles,
} from 'lucide-react';

interface StoreInfo {
  id: string;
  name: string;
  subdomain: string;
  primaryColor: string;
  logoUrl: string | null;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string | null;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
}

function getCurrencySymbol(c: string) {
  const s: Record<string, string> = { NGN: '\u20a6', USD: '$', GHS: 'GH\u20b5', KES: 'KSh' };
  return s[c] ?? c + ' ';
}

function formatPrice(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30 ring-yellow-200/50 dark:ring-yellow-800/30', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 ring-blue-200/50 dark:ring-blue-800/30', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200/50 dark:ring-emerald-800/30', icon: Package },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30 ring-purple-200/50 dark:ring-purple-800/30', icon: ShoppingBag },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30 ring-orange-200/50 dark:ring-orange-800/30', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200/50 dark:ring-emerald-800/30', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30 ring-green-200/50 dark:ring-green-800/30', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 ring-red-200/50 dark:ring-red-800/30', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800 ring-gray-200/50 dark:ring-gray-700/30', icon: XCircle },
};

export default function CustomerAccountClient({ store }: { store: StoreInfo }) {
  const [view, setView] = useState<'auth' | 'orders' | 'order-detail' | 'track'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [trackForm, setTrackForm] = useState({ orderNumber: '', phone: '' });
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const storageKey = `tekhuna_customer_${store.id}`;

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authData = urlParams.get('auth');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        google_denied: 'Google sign-in was cancelled.',
        token_exchange_failed: 'Google authentication failed. Please try again.',
        userinfo_failed: 'Could not retrieve your Google profile. Please try again.',
        no_email: 'No email associated with your Google account.',
        server_error: 'Something went wrong. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (authData) {
      try {
        const parsed = JSON.parse(atob(authData.replace(/-/g, '+').replace(/_/g, '/')));
        if (parsed.token && parsed.customer) {
          setToken(parsed.token);
          setCustomer(parsed.customer);
          localStorage.setItem(storageKey, JSON.stringify({ token: parsed.token, customer: parsed.customer }));
          setView('orders');
        }
      } catch { /* ignore */ }
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.customer) {
          setToken(parsed.token);
          setCustomer(parsed.customer);
          setView('orders');
        }
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const fetchOrders = useCallback(async (authToken: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/store/${store.subdomain}/my-orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  }, [store.subdomain]);

  useEffect(() => {
    if (token && view === 'orders') {
      fetchOrders(token);
    }
  }, [token, view, fetchOrders]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = authMode === 'register'
      ? `/api/store/${store.subdomain}/auth/register`
      : `/api/store/${store.subdomain}/auth/login`;

    const payload = authMode === 'register'
      ? { name: form.name, phone: form.phone, email: form.email || undefined, password: form.password }
      : { phone: form.phone, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setToken(data.token);
      setCustomer(data.customer);
      localStorage.setItem(storageKey, JSON.stringify({ token: data.token, customer: data.customer }));
      setView('orders');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCustomer(null);
    setOrders([]);
    setSelectedOrder(null);
    localStorage.removeItem(storageKey);
    setView('auth');
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackLoading(true);
    try {
      const params = new URLSearchParams({
        orderNumber: trackForm.orderNumber.trim().toUpperCase(),
        phone: trackForm.phone.trim(),
      });
      const res = await fetch(`/api/store/${store.subdomain}/track-order?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackError(data.error || 'Order not found');
      } else {
        setSelectedOrder(data.order);
        setView('order-detail');
      }
    } catch {
      setTrackError('Network error. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const viewOrder = (order: Order) => {
    setSelectedOrder(order);
    setView('order-detail');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href={`/store/${store.subdomain}`} className="flex items-center gap-2.5 font-bold text-sm hover:opacity-80 transition">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: store.primaryColor }}>
              {store.name.charAt(0)}
            </div>
            {store.name}
          </Link>
          {customer && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline font-medium">{customer.name}</span>
              <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Auth View */}
        {view === 'auth' && (
          <div className="max-w-md mx-auto">
            {/* Tab switcher */}
            <div className="flex rounded-2xl border border-border/50 bg-white p-1 mb-7 shadow-sm">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${authMode !== 'register' && view === 'auth' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setView('track')}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all text-muted-foreground hover:text-foreground"
              >
                Track Order
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${authMode === 'register' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ backgroundColor: `${store.primaryColor}10`, boxShadow: `0 8px 25px ${store.primaryColor}15` }}>
                <User className="w-7 h-7" style={{ color: store.primaryColor }} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {authMode === 'login' ? 'Log in to track your orders' : `Create an account with ${store.name}`}
              </p>
            </div>

            <form onSubmit={handleAuth} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-border/50 p-7 space-y-4 shadow-sm">
              {authMode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Full Name</label>
                  <input
                    type="text" required placeholder="Your full name"
                    className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel" required placeholder="e.g. 08012345678"
                  className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                  value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              {authMode === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email (optional)</label>
                  <input
                    type="email" placeholder="your@email.com"
                    className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Password</label>
                <input
                  type="password" required placeholder={authMode === 'register' ? 'Min 6 characters' : 'Your password'}
                  className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl ring-1 ring-red-200/50 dark:ring-red-800/30 font-medium">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                style={{ backgroundColor: store.primaryColor }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-900 px-4 text-muted-foreground/60 font-medium">or</span></div>
              </div>

              <button
                type="button"
                disabled={googleLoading}
                onClick={() => {
                  setGoogleLoading(true);
                  setError('');
                  window.location.href = `/api/store/auth/google?slug=${encodeURIComponent(store.subdomain)}`;
                }}
                className="w-full py-3 rounded-xl border border-border/50 font-semibold text-sm transition-all hover:bg-muted/30 flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <p className="text-center text-sm text-muted-foreground pt-1">
                {authMode === 'login' ? (
                  <>Don&apos;t have an account? <button type="button" onClick={() => { setAuthMode('register'); setError(''); }} className="font-semibold hover:underline" style={{ color: store.primaryColor }}>Sign up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => { setAuthMode('login'); setError(''); }} className="font-semibold hover:underline" style={{ color: store.primaryColor }}>Log in</button></>
                )}
              </p>
            </form>

            <p className="text-center mt-8">
              <Link href={`/store/${store.subdomain}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to store
              </Link>
            </p>
          </div>
        )}

        {/* Track Order View (guest) */}
        {view === 'track' && (
          <div className="max-w-md mx-auto">
            {/* Tab switcher */}
            <div className="flex rounded-2xl border border-border/50 bg-white p-1 mb-7 shadow-sm">
              <button type="button" onClick={() => setView('auth')} className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all text-muted-foreground hover:text-foreground">Log In</button>
              <button type="button" className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all bg-primary text-primary-foreground shadow-sm">Track Order</button>
              <button type="button" onClick={() => setView('auth')} className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all text-muted-foreground hover:text-foreground">Sign Up</button>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ backgroundColor: `${store.primaryColor}10`, boxShadow: `0 8px 25px ${store.primaryColor}15` }}>
                <Package className="w-7 h-7" style={{ color: store.primaryColor }} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
              <p className="text-sm text-muted-foreground mt-2">Enter your order number and phone to check status</p>
            </div>

            <form onSubmit={handleTrackOrder} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-border/50 p-7 space-y-4 shadow-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Order Number</label>
                <input
                  type="text" required placeholder="e.g. ORD-ABC123-XY12"
                  className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all font-mono uppercase"
                  value={trackForm.orderNumber}
                  onChange={e => { setTrackForm(p => ({ ...p, orderNumber: e.target.value })); setTrackError(''); }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel" required placeholder="Phone used when ordering"
                  className="w-full px-4 py-3 text-sm border border-border/50 rounded-xl bg-muted/20 focus:bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all"
                  value={trackForm.phone}
                  onChange={e => { setTrackForm(p => ({ ...p, phone: e.target.value })); setTrackError(''); }}
                />
              </div>

              {trackError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 rounded-xl ring-1 ring-red-200/50 font-medium">{trackError}</p>}

              <button
                type="submit" disabled={trackLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                style={{ backgroundColor: store.primaryColor }}
              >
                {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {trackLoading ? 'Searching…' : 'Track Order'}
              </button>
            </form>

            <p className="text-center mt-8">
              <Link href={`/store/${store.subdomain}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to store
              </Link>
            </p>
          </div>
        )}

        {/* Orders List View */}
        {view === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
                <p className="text-sm text-muted-foreground mt-1">Track and manage your orders from {store.name}</p>
              </div>
              <Link
                href={`/store/${store.subdomain}`}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-border/50 hover:bg-muted/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>

            {ordersLoading ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-3">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900/80 rounded-2xl border border-dashed border-border/50">
                <Package className="w-16 h-16 mx-auto text-muted-foreground/15 mb-4" />
                <h3 className="font-bold text-lg">No orders yet</h3>
                <p className="text-sm text-muted-foreground mt-1.5">Start shopping to see your orders here</p>
                <Link
                  href={`/store/${store.subdomain}`}
                  className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: store.primaryColor }}
                >
                  <ShoppingBag className="w-4 h-4" /> Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusConf.icon;
                  return (
                    <button
                      key={order.id}
                      onClick={() => viewOrder(order)}
                      className="w-full bg-white dark:bg-gray-900/80 rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${statusConf.color} ${statusConf.bg}`}>
                              <StatusIcon className="w-3 h-3" />{statusConf.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                            {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg" style={{ color: store.primaryColor }}>
                            {formatPrice(order.totalAmount, order.currency)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Order Detail View */}
        {view === 'order-detail' && selectedOrder && (() => {
          const order = selectedOrder;
          const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const StatusIcon = statusConf.icon;
          const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
          const currentStep = steps.indexOf(order.status);

          return (
            <div>
              <button onClick={() => token ? setView('orders') : setView('track')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition font-medium">
                <ArrowLeft className="w-4 h-4" /> {token ? 'Back to orders' : 'Track another order'}
              </button>

              <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-border/50 p-7 space-y-7 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Order {order.orderNumber}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold ring-1 ${statusConf.color} ${statusConf.bg}`}>
                    <StatusIcon className="w-4 h-4" />{statusConf.label}
                  </span>
                </div>

                {/* Progress Tracker */}
                {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
                  <div className="py-5">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-3 left-0 right-0 h-[3px] bg-gray-100 dark:bg-gray-800 rounded-full" />
                      <div className="absolute top-3 left-0 h-[3px] rounded-full transition-all duration-500" style={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%`, backgroundColor: store.primaryColor }} />
                      {steps.map((step, idx) => {
                        const isActive = idx <= currentStep;
                        const stepConf = STATUS_CONFIG[step] || STATUS_CONFIG.PENDING;
                        return (
                          <div key={step} className="relative flex flex-col items-center z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                isActive ? 'text-white shadow-md' : 'bg-white dark:bg-gray-900 text-muted-foreground/40 border-gray-200 dark:border-gray-700'
                              }`}
                              style={isActive ? { backgroundColor: store.primaryColor, borderColor: store.primaryColor } : {}}
                            >
                              {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />}
                            </div>
                            <span className={`text-[10px] mt-2 font-semibold ${isActive ? '' : 'text-muted-foreground/50'}`}>{stepConf.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h3 className="font-bold text-sm mb-3">Items Ordered</h3>
                  <div className="space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3.5 bg-muted/30 rounded-xl border border-border/30">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatPrice(item.unitPrice, order.currency)}</p>
                        </div>
                        <span className="font-bold text-sm">{formatPrice(item.totalAmount, order.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="font-bold text-xl" style={{ color: store.primaryColor }}>{formatPrice(order.totalAmount, order.currency)}</span>
                  </div>
                  {order.deliveryAddress && (
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Delivery: </span>
                      <span className="font-medium">{order.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="mt-2 text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="text-right">
                      <span className={`font-semibold ${order.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                        {order.paymentStatus === 'COMPLETED' ? 'Paid' : order.paymentStatus === 'PENDING' ? 'Awaiting payment' : order.paymentStatus}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-muted-foreground text-xs block mt-0.5">
                          {order.paymentMethod === 'pay_on_delivery' ? 'Pay on Delivery'
                            : order.paymentMethod === 'bank_transfer' ? 'Bank Transfer'
                            : order.paymentMethod === 'mobile_money' ? 'Mobile Money'
                            : order.paymentMethod}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Chat Widget */}
      <script src="/widget/tekhuna-chat.js" data-tenant-id={store.id} />
    </div>
  );
}
