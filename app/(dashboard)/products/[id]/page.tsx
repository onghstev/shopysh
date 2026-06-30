'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, Package, Loader2, AlertTriangle, ShieldX, ShieldCheck } from 'lucide-react';
import ProductImageUploader from '@/components/product-image-uploader';
import { toast } from 'sonner';
import type { ModerationResult } from '@/lib/ai-moderation';

const RISK_CONFIG = {
  low:    { label: 'Low risk',    Icon: ShieldCheck,  cls: 'text-green-700 bg-green-50 border-green-200' },
  medium: { label: 'Medium risk', Icon: AlertTriangle, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  high:   { label: 'High risk',   Icon: ShieldX,      cls: 'text-red-700 bg-red-50 border-red-200' },
} as const;

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [modResult, setModResult] = useState<ModerationResult | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [form, setForm] = useState<any>({});
  const [images, setImages] = useState<any[]>([]);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${params?.id}`);
      if (res.ok) {
        const data = await res.json();
        const p = data?.product ?? {};
        setProduct(p);
        setImages(p?.images ?? []);
        setForm({
          name: p?.name ?? '', description: p?.description ?? '', sku: p?.sku ?? '',
          price: p?.price ?? '', compareAtPrice: p?.compareAtPrice ?? '', costPrice: p?.costPrice ?? '',
          stock: p?.stock ?? 0, lowStockThreshold: p?.lowStockThreshold ?? 5,
          categoryId: p?.categoryId ?? '', unit: p?.unit ?? 'piece', isActive: p?.isActive ?? true,
        });
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [params?.id]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) { const data = await res.json(); setCategories(data?.categories ?? []); }
    } catch (e: any) { console.error(e); }
  }, []);

  useEffect(() => { fetchProduct(); fetchCategories(); }, [fetchProduct, fetchCategories]);

  const doSave = async (gmcModeration: ModerationResult | null, savedAnyway = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          stock: parseInt(form.stock) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
          ...(gmcModeration ? { gmcModeration: { ...gmcModeration, savedAnyway } } : {}),
        }),
      });
      if (res.ok) {
        if (gmcModeration?.riskLevel === 'high' && savedAnyway) {
          toast.warning('Product saved — it will NOT appear on Google Shopping due to policy issues.');
        } else {
          toast.success('Product updated');
        }
        router.push('/products');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? 'Failed to update');
      }
    } catch (e: any) { console.error(e); toast.error('Error updating product'); } finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModerating(true);
    try {
      const res = await fetch('/api/products/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description }),
      });
      const result: ModerationResult = res.ok ? await res.json() : { riskLevel: 'low', riskScore: 0, flags: [], flagDetails: '', suggestion: null, reviewedAt: new Date().toISOString() };
      setModResult(result);
      if (result.riskLevel === 'low') {
        await doSave(result, false);
      } else {
        setShowWarning(true);
      }
    } catch {
      await doSave(null, false);
    } finally {
      setModerating(false);
    }
  };

  const handleSaveAnyway = async () => {
    setShowWarning(false);
    await doSave(modResult, true);
  };

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...(prev ?? {}), [key]: value }));

  const riskCfg = modResult ? RISK_CONFIG[modResult.riskLevel] : null;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!product) return <div className="text-center py-20"><p className="text-muted-foreground">Product not found</p><Button asChild className="mt-4"><Link href="/products">Back to Products</Link></Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
        <div><h1 className="font-display text-2xl font-bold tracking-tight">Edit Product</h1><p className="text-muted-foreground text-sm">{product?.name ?? ''}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Name</Label><Input value={form?.name ?? ''} onChange={(e: any) => update('name', e.target.value)} required /></div>
              <div><Label>Description</Label><Textarea value={form?.description ?? ''} onChange={(e: any) => update('description', e.target.value)} rows={3} /></div>
              <div><Label>SKU</Label><Input value={form?.sku ?? ''} onChange={(e: any) => update('sku', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Price</Label><Input type="number" step="0.01" value={form?.price ?? ''} onChange={(e: any) => update('price', e.target.value)} required /></div>
              <div><Label>Compare Price</Label><Input type="number" step="0.01" value={form?.compareAtPrice ?? ''} onChange={(e: any) => update('compareAtPrice', e.target.value)} /></div>
              <div><Label>Cost Price</Label><Input type="number" step="0.01" value={form?.costPrice ?? ''} onChange={(e: any) => update('costPrice', e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Stock</Label><Input type="number" value={form?.stock ?? 0} onChange={(e: any) => update('stock', e.target.value)} /></div>
              <div><Label>Low Stock Alert</Label><Input type="number" value={form?.lowStockThreshold ?? 5} onChange={(e: any) => update('lowStockThreshold', e.target.value)} /></div>
              <div><Label>Unit</Label><Input value={form?.unit ?? ''} onChange={(e: any) => update('unit', e.target.value)} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form?.categoryId ?? ''} onValueChange={(v: string) => update('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{(categories ?? []).map((c: any) => <SelectItem key={c?.id} value={c?.id ?? ''}>{c?.name ?? ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          {product?.id && (
            <ProductImageUploader
              productId={product.id}
              images={images}
              onImagesChange={setImages}
            />
          )}
          <Button type="submit" className="w-full" disabled={saving || moderating}>
            {(saving || moderating) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {moderating ? 'Checking content…' : saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* AI Moderation Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={(open) => { if (!open) setShowWarning(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {riskCfg && <riskCfg.Icon className="w-5 h-5" />}
              Google Shopping Content Review
            </DialogTitle>
            <DialogDescription>
              Our AI content moderator detected potential issues with this product listing.
            </DialogDescription>
          </DialogHeader>
          {modResult && riskCfg && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium ${riskCfg.cls}`}>
                <riskCfg.Icon className="w-4 h-4 shrink-0" />
                <span>{riskCfg.label} — Score {modResult.riskScore}/100</span>
              </div>
              {modResult.flags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Issues detected:</p>
                  <div className="flex flex-wrap gap-1">
                    {modResult.flags.map((f) => (
                      <span key={f} className="text-xs bg-muted px-2 py-0.5 rounded-full border">{f.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-muted/40 rounded-md p-3 text-sm text-muted-foreground">
                {modResult.flagDetails}
              </div>
              {modResult.suggestion && (
                <div>
                  <p className="text-sm font-medium mb-1">Suggested revision:</p>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                    {modResult.suggestion}
                  </div>
                </div>
              )}
              {modResult.riskLevel === 'high' && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  <ShieldX className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>If you save anyway, this product will be <strong>excluded from Google Shopping feeds</strong> until the description is revised.</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Edit Description
            </Button>
            <Button
              variant={modResult?.riskLevel === 'high' ? 'destructive' : 'default'}
              onClick={handleSaveAnyway}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
