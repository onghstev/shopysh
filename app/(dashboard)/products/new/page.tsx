'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Plus, ImagePlus } from 'lucide-react';
import ProductImageUploader from '@/components/product-image-uploader';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', sku: '', price: '', costPrice: '', currency: 'NGN',
    stockQuantity: '0', lowStockThreshold: '10', categoryId: '', trackInventory: true, isFeatured: false,
  });

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    if (res.ok) { const d = await res.json(); setCategories(d?.categories ?? []); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) { toast.error('Category name is required'); return; }
    setCreatingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Category "${newCatName.trim()}" created`);
        setNewCatName('');
        setNewCatDesc('');
        setCatDialogOpen(false);
        await fetchCategories();
        if (data?.category?.id) update('categoryId', data.category.id);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? 'Failed to create category');
      }
    } catch { toast.error('Failed to create category'); } finally { setCreatingCat(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          stockQuantity: parseInt(form.stockQuantity, 10) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 10,
          categoryId: form.categoryId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Product created! You can now add images.');
        setCreatedProductId(data?.product?.id);
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed to create product');
      }
    } catch (e: any) { toast.error('Failed'); } finally { setLoading(false); }
  };

  const update = (field: string, value: any) => setForm((p: any) => ({ ...(p ?? {}), [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/products"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="font-display text-2xl font-bold tracking-tight">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e: any) => update('name', e?.target?.value ?? '')} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e: any) => update('description', e?.target?.value ?? '')} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e: any) => update('sku', e?.target?.value ?? '')} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select value={form.categoryId} onValueChange={(v: string) => update('categoryId', v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c: any) => <SelectItem key={c?.id} value={c?.id ?? ''}>{c?.name ?? '-'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setCatDialogOpen(true)} title="Create new category">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle className="text-base">Pricing & Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e: any) => update('price', e?.target?.value ?? '')} required />
              </div>
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input type="number" step="0.01" value={form.costPrice} onChange={(e: any) => update('costPrice', e?.target?.value ?? '')} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v: string) => update('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">₦ NGN</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="GHS">GH₵ GHS</SelectItem>
                    <SelectItem value="KES">KSh KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input type="number" value={form.stockQuantity} onChange={(e: any) => update('stockQuantity', e?.target?.value ?? '0')} />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" value={form.lowStockThreshold} onChange={(e: any) => update('lowStockThreshold', e?.target?.value ?? '10')} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.trackInventory} onCheckedChange={(v: boolean) => update('trackInventory', v)} />
                <Label>Track Inventory</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v: boolean) => update('isFeatured', v)} />
                <Label>Featured Product</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {!createdProductId && (
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Product
            </Button>
            <Link href="/products"><Button variant="outline">Cancel</Button></Link>
          </div>
        )}
      </form>

      {createdProductId && (
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageUploader
              productId={createdProductId}
              images={images}
              onImagesChange={setImages}
            />
            <div className="mt-4 flex gap-3">
              <Button onClick={() => router.push(`/products/${createdProductId}`)}>
                Continue to Edit Product
              </Button>
              <Link href="/products"><Button variant="outline">Back to Products</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a product category to organize your inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input value={newCatName} onChange={(e: any) => setNewCatName(e?.target?.value ?? '')} placeholder="e.g. Health & Wellness" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newCatDesc} onChange={(e: any) => setNewCatDesc(e?.target?.value ?? '')} placeholder="Optional description" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCategory} disabled={creatingCat}>
              {creatingCat ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
