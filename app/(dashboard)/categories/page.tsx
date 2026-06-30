'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FolderOpen, Plus, Trash2, Edit2, Package, Loader2, FolderTree, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
  children: Category[];
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data?.categories ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null }),
      });
      if (res.ok) {
        toast.success('Category created');
        setShowCreate(false);
        setForm({ name: '', description: '' });
        await fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to create category');
      }
    } catch {
      toast.error('Error creating category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget || !form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null }),
      });
      if (res.ok) {
        toast.success('Category updated');
        setShowEdit(false);
        setEditTarget(null);
        setForm({ name: '', description: '' });
        await fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to update category');
      }
    } catch {
      toast.error('Error updating category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted');
        setDeleteTarget(null);
        await fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to delete category');
      }
    } catch {
      toast.error('Error deleting category');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({ name: cat.name, description: cat.description ?? '' });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setForm({ name: '', description: '' }); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" />New Category
          </Button>
        )}
      </div>

      {/* Category List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Product Categories
          </CardTitle>
          <CardDescription>Organize your products into categories for better management</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No categories yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isSuperAdmin ? 'Create your first category to organize products' : 'No categories have been set up yet'}
              </p>
              {isSuperAdmin && (
                <Button className="mt-4" onClick={() => { setForm({ name: '', description: '' }); setShowCreate(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Create Category
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-4 group hover:bg-muted/30 -mx-4 px-4 rounded-lg transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cat.name}</p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-md">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-xs font-mono">
                      <Package className="w-3 h-3 mr-1" />
                      {cat._count.products} product{cat._count.products !== 1 ? 's' : ''}
                    </Badge>
                    {isSuperAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new product category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Electronics, Fashion, Food"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
              {(deleteTarget?._count?.products ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This category has {deleteTarget?._count.products} product{(deleteTarget?._count?.products ?? 0) > 1 ? 's' : ''}. You must reassign them before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
