'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, CheckCircle, X, Minus, Plus, Truck, Building2, Smartphone, Copy, Check, ArrowLeft, AlertCircle } from 'lucide-react';

function formatPrice(amount: number, currency: string) {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh' };
  return `${symbols[currency] ?? currency + ' '}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
}

const PAYMENT_OPTIONS = [
  { value: 'pay_on_delivery', label: 'Pay on Delivery',  description: 'Cash when your order arrives', Icon: Truck },
  { value: 'bank_transfer',   label: 'Bank Transfer',    description: 'Transfer to store bank account', Icon: Building2 },
  { value: 'mobile_money',    label: 'Mobile Money',     description: 'Opay, Palmpay, Kuda, etc.', Icon: Smartphone },
] as const;
type PaymentMethod = typeof PAYMENT_OPTIONS[number]['value'];

type Step = 'start' | 'details' | 'payment' | 'done';

interface Props {
  product: { id: string; name: string; price: number; currency: string; stockQuantity: number };
  slug: string;
  storeId: string;
  storeName: string;
  bankAccounts: BankAccount[];
  storePhone: string | null;
}

export default function StorefrontOrderForm({ product, slug, storeId, storeName, bankAccounts, storePhone }: Props) {
  const [step, setStep] = useState<Step>('start');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_delivery');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
        }
      }
    } catch { /* ignore */ }
  }, [storeId]);

  const total = formatPrice(product.price * quantity, product.currency);

  const reset = () => {
    setStep('start');
    setQuantity(1);
    setPaymentMethod('pay_on_delivery');
    setForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setOrderResult(null);
    setPaymentError(null);
  };

  // Step 2 → Step 3: validate payment method availability before going further
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    if (paymentMethod === 'bank_transfer' && bankAccounts.length === 0) {
      setPaymentError('Bank Transfer is not available at this store. Please choose Pay on Delivery or contact the store.');
      return;
    }
    if (paymentMethod === 'mobile_money') {
      setPaymentError('Mobile Money payment is not yet configured for this store. Please choose Pay on Delivery or Bank Transfer.');
      return;
    }

    setPaymentError(null);

    // Pay on Delivery skips the payment preview — go straight to placing order
    if (paymentMethod === 'pay_on_delivery') {
      placeOrder();
    } else {
      setStep('payment');
    }
  };

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          customer: {
            name: form.name, phone: form.phone,
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
        setStep('done');
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

  // ── Step: Done ────────────────────────────────────────────────────────────
  if (step === 'done' && orderResult) {
    const isPOD = paymentMethod === 'pay_on_delivery';
    return (
      <div className={`rounded-2xl p-5 space-y-3 ${isPOD ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className={`w-7 h-7 shrink-0 mt-0.5 ${isPOD ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div>
            <p className={`font-bold text-sm ${isPOD ? 'text-emerald-800' : 'text-amber-800'}`}>
              {isPOD ? 'Order Confirmed!' : 'Order Placed — Transfer Sent!'}
            </p>
            <p className={`text-xs mt-0.5 ${isPOD ? 'text-emerald-700' : 'text-amber-700'}`}>
              {orderResult.orderNumber} · {formatPrice(orderResult.totalAmount, orderResult.currency)}
            </p>
          </div>
        </div>
        <p className={`text-xs ${isPOD ? 'text-emerald-700' : 'text-amber-700'}`}>{orderResult.message}</p>
        <button onClick={reset} className={`text-xs font-medium hover:underline ${isPOD ? 'text-emerald-600' : 'text-amber-700'}`}>
          Place another order
        </button>
      </div>
    );
  }

  // ── Step: Payment preview (Bank Transfer only) ────────────────────────────
  if (step === 'payment') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStep('details')} className="text-amber-700 hover:text-amber-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-sm text-amber-900">Bank Transfer Details</h3>
        </div>

        <p className="text-sm text-amber-800">
          Transfer <span className="font-bold">{total}</span> to any of the accounts below, then click <strong>I've Paid</strong> to confirm your order.
        </p>

        <div className="space-y-2">
          {bankAccounts.map((acct, i) => (
            <BankDetailCard key={i} acct={acct} />
          ))}
        </div>

        <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
          Use <strong>{form.name}</strong> or your phone number as the transfer narration so the store can identify your payment.
        </p>

        <button
          onClick={placeOrder}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {submitting ? 'Placing Order…' : "I've Paid — Place My Order"}
        </button>
        <button type="button" onClick={() => setStep('details')} className="w-full text-xs text-amber-700 hover:underline">
          ← Change payment method
        </button>
      </div>
    );
  }

  // ── Step: Details form ────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <form onSubmit={handleContinueToPayment} className="bg-[#f8f7f4] border border-border/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Your Details</h3>
          <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground">
          {quantity}× {product.name} — <strong>{total}</strong>
        </p>

        <div className="grid gap-3">
          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Your name', required: true },
            { label: 'Phone Number *', key: 'phone', type: 'tel', placeholder: 'e.g. 08012345678', required: true },
            { label: 'Email (optional)', key: 'email', type: 'email', placeholder: 'your@email.com', required: false },
            { label: 'Delivery Address (optional)', key: 'address', type: 'text', placeholder: 'Delivery address', required: false },
          ].map(({ label, key, type, placeholder, required }) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
              <input
                type={type} required={required} placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
            <textarea
              placeholder="Any special instructions…"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none transition-all"
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
                  onClick={() => { setPaymentMethod(value); setPaymentError(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    paymentMethod === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-tight ${paymentMethod === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    paymentMethod === value ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {paymentMethod === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method error */}
          {paymentError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {submitting ? 'Placing Order…' : paymentMethod === 'bank_transfer' ? 'Continue to Payment →' : paymentMethod === 'mobile_money' ? 'Continue to Payment →' : `Place Order — ${total}`}
        </button>
      </form>
    );
  }

  // ── Step: Start (quantity picker) ─────────────────────────────────────────
  return (
    <div className="bg-[#f8f7f4] border border-border/50 rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-sm">Order this product</h3>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Qty:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white">
          <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors"><Minus className="w-3.5 h-3.5" /></button>
          <span className="px-4 py-2 min-w-[3rem] text-center font-semibold text-sm border-x border-border">{quantity}</span>
          <button type="button" onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))} className="px-3 py-2 hover:bg-muted transition-colors"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <span className="text-sm font-bold text-gold">{total}</span>
      </div>
      <button
        onClick={() => setStep('details')}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition"
      >
        <ShoppingCart className="w-4 h-4" /> Order Now
      </button>
    </div>
  );
}

function BankDetailCard({ acct }: { acct: BankAccount }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(acct.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-white rounded-xl border border-amber-200 p-3 space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{acct.bankName}</p>
      <p className="text-sm font-medium text-foreground">{acct.accountName}</p>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <p className="text-base font-bold font-mono tracking-wider text-foreground">{acct.accountNumber}</p>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors shrink-0">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
