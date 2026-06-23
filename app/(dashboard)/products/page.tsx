'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { data: session } = useSession() || {};
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const currency = session?.user?.tenantCurrency ?? 'NGN';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);
      if (stockStatus && stockStatus !== 'all') params.set('stockStatus', stockStatus);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data?.products ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, [page, search, categoryId, stockStatus]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data?.categories ?? []);
      }
    } catch (e: any) { console.error(e); }
  }, []);

  // Read stockStatus from URL on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStock = params.get('stockStatus');
    if (urlStock) setStockStatus(urlStock);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Product deleted'); fetchProducts(); }
    else toast.error('Delete failed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} product{total !== 1 ? 's' : ''} in catalog</p>
        </div>
        <Link href="/products/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10" value={search} onChange={(e: any) => { setSearch(e?.target?.value ?? ''); setPage(1); }} />
            </div>
            <Select value={categoryId} onValueChange={(v: string) => { setCategoryId(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories ?? []).map((c: any) => <SelectItem key={c?.id} value={c?.id ?? ''}>{c?.name ?? '-'}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stockStatus} onValueChange={(v: string) => { setStockStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Stock Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (products?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No products found</p>
              <Link href="/products/new"><Button className="mt-4"><Plus className="w-4 h-4 mr-2" /> Add Your First Product</Button></Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products ?? []).map((p: any) => (
                    <TableRow key={p?.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{p?.name ?? '-'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p?.description ?? ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{p?.sku ?? '-'}</TableCell>
                      <TableCell>{p?.category?.name ?? '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p?.price, p?.currency ?? currency)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p?.stockQuantity <= (p?.lowStockThreshold ?? 10) ? 'destructive' : 'secondary'}>
                          {p?.stockQuantity ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/products/${p?.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(p?.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > 20 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground self-center">Page {page}</span>
                  <Button variant="outline" size="sm" disabled={products.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
