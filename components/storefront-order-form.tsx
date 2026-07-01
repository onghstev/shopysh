'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, CheckCircle, X, Minus, Plus, Truck, Building2, Smartphone } from 'lucide-react';

const PAYMENT_OPTIONS = [
  {
    value: 'pay_on_delivery',
    label: 'Pay on Delivery',
    description: 'Cash when your order arrives',
    Icon: Truck,
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Transfer to store bank account',
    Icon: Building2,
  },
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    description: 'Opay, Palmpay, Kuda, etc.',
    Icon: Smartphone,
  },
] as const;

type PaymentMethod = typeof PAYMENT_OPTIONS[number]['value'];

function formatPrice(amount: number, currency: string) {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh' };
  return `${symbols[currency] ?? currency + ' '}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface OrderFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    stockQuantity: number;
  };
  slug: string;
  storeId: string;
  storeName: string;
}

export default function StorefrontOrderForm({ product, slug, storeId, storeName }: OrderFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_delivery');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Pre-fill from logged-in customer
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tekhuna_customer_${storeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customer) {
          setForm(f => ({
            ...f,
            name: parsed.customer.name || f.name,
            phone: (parsed.customer.phone && !parsed.customer.phone.startsWith('g-')) ? parsed.customer.phone : f.phone,
            email: parsed.customer.email || f.email,
          }));
          setIsLoggedIn(true);
        }
      }
    } catch { /* ignore */ }
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          customer: {
            name: form.name,
            phone: form.phone,
            email: form.email || undefined,
            address: form.address || undefined,
            notes: form.notes || undefined,
            paymentMethod,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderResult(data);
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (product.stockQuantity <= 0) return null;

  if (orderResult) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 space-y-3 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300">Order Placed!</h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Order <strong>{orderResult.orderNumber}</strong> — {formatPrice(orderResult.totalAmount, orderResult.currency)}
        </p>
        <p className="text-xs text-muted-foreground">{orderResult.message}</p>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Payment: {PAYMENT_OPTIONS.find(o => o.value === paymentMethod)?.label ?? paymentMethod}
        </p>
        <button
          onClick={() => { setOrderResult(null); setShowForm(false); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); setQuantity(1); setPaymentMethod('pay_on_delivery'); }}
          className="text-sm text-emerald-600 hover:underline mt-2"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-base">Order this product</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Qty:</span>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition"><Minus className="w-3.5 h-3.5" /></button>
              <span className="px-4 py-1.5 min-w-[3rem] text-center font-medium text-sm border-x">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <span className="text-sm font-semibold text-emerald-600">{formatPrice(product.price * quantity, product.currency)}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition text-sm"
          >
            <ShoppingCart className="w-4 h-4" /> Order Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Your Details</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ordering {quantity}x {product.name} — <strong>{formatPrice(product.price * quantity, product.currency)}</strong>
          </p>
          <div className="grid gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
              <input
                type="text" required placeholder="Your name"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
              <input
                type="tel" required placeholder="e.g. 08012345678"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email (optional)</label>
              <input
                type="email" placeholder="your@email.com"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Delivery Address (optional)</label>
              <input
                type="text" placeholder="Delivery address"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
              <textarea
                placeholder="Any special instructions..."
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                rows={2}
                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Method *</label>
              <div className="grid gap-2">
                {PAYMENT_OPTIONS.map(({ value, label, description, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-border bg-white dark:bg-gray-900 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === value ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-muted-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${paymentMethod === value ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      paymentMethod === value ? 'border-emerald-500 bg-emerald-500' : 'border-border'
                    }`}>
                      {paymentMethod === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit" disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition text-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {submitting ? 'Placing Order...' : `Place Order — ${formatPrice(product.price * quantity, product.currency)}`}
          </button>
        </form>
      )}
    </div>
  );
}
