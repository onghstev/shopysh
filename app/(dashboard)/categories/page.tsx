'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FolderOpen, Folder, Plus, Trash2, Edit2, Package, Loader2, FolderTree, AlertTriangle,
  Search, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightSm, Tag,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

interface SubCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  _count: { products: number };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
  children: SubCategory[];
}

type DialogMode = 'create-parent' | 'create-child' | 'edit-parent' | 'edit-child';

export default function CategoriesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [dialogParent, setDialogParent] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | SubCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ item: Category | SubCategory; isChild: boolean } | null>(null);
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

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() =>
    categories.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        c.children.some((ch) => ch.name.toLowerCase().includes(q))
      );
    }),
    [categories, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setDialogParent(null);
    setEditTarget(null);
    setDialogMode('create-parent');
  };

  const openCreateChild = (parent: Category) => {
    setForm({ name: '', description: '' });
    setDialogParent(parent);
    setEditTarget(null);
    setDialogMode('create-child');
  };

  const openEditParent = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description ?? '' });
    setDialogParent(null);
    setEditTarget(cat);
    setDialogMode('edit-parent');
  };

  const openEditChild = (parent: Category, child: SubCategory) => {
    setForm({ name: child.name, description: child.description ?? '' });
    setDialogParent(parent);
    setEditTarget(child);
    setDialogMode('edit-child');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditTarget(null);
    setDialogParent(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const isEdit = dialogMode === 'edit-parent' || dialogMode === 'edit-child';
      const url = isEdit ? `/api/categories/${editTarget!.id}` : '/api/categories';
      const body: any = { name: form.name.trim(), description: form.description.trim() || null };
      if (!isEdit && dialogMode === 'create-child' && dialogParent) {
        body.parentId = dialogParent.id;
      }

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Updated' : 'Created');
        // Auto-expand the parent after adding a sub-category
        if (dialogMode === 'create-child' && dialogParent) {
          setExpanded((prev) => new Set([...prev, dialogParent.id]));
        }
        closeDialog();
        await fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to save');
      }
    } catch { toast.error('Error saving'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.item.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted');
        setDeleteTarget(null);
        await fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Failed to delete');
      }
    } catch { toast.error('Error deleting'); } finally { setDeleting(false); }
  };

  const dialogTitle =
    dialogMode === 'create-parent' ? 'New Category' :
    dialogMode === 'create-child'  ? `New Sub-category under "${dialogParent?.name}"` :
    dialogMode === 'edit-parent'   ? 'Edit Category' :
                                     'Edit Sub-category';

  const totalSubCount = categories.reduce((n, c) => n + c.children.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {categories.length} parent {categories.length !== 1 ? 'categories' : 'category'}, {totalSubCount} sub-categories
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />New Category
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Product Categories
              </CardTitle>
              <CardDescription className="mt-1">
                {isSuperAdmin
                  ? 'Manage platform-wide categories and sub-categories available to all merchants.'
                  : 'Platform categories defined by Shopysh. Select one when creating a product.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-20 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
              {isSuperAdmin && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />Create Category
                </Button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No categories match &ldquo;{search}&rdquo;</p>
              <Button variant="ghost" className="mt-3" onClick={() => setSearch('')}>Clear search</Button>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {paginated.map((cat) => {
                  const isOpen = expanded.has(cat.id);
                  const hasChildren = cat.children.length > 0;

                  return (
                    <div key={cat.id}>
                      {/* Parent row */}
                      <div className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-4 px-4 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Expand toggle */}
                          <button
                            className={`w-6 h-6 flex items-center justify-center rounded text-muted-foreground transition-colors ${hasChildren ? 'hover:text-foreground hover:bg-muted' : 'cursor-default opacity-0'}`}
                            onClick={() => hasChildren && toggleExpand(cat.id)}
                            tabIndex={hasChildren ? 0 : -1}
                          >
                            {hasChildren ? (
                              isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRightSm className="w-4 h-4" />
                            ) : null}
                          </button>

                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Folder className="w-4 h-4 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{cat.name}</p>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-md">{cat.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {hasChildren && (
                            <Badge variant="outline" className="text-xs font-normal hidden sm:flex">
                              <Tag className="w-3 h-3 mr-1" />
                              {cat.children.length} sub
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs font-mono hidden sm:flex">
                            <Package className="w-3 h-3 mr-1" />
                            {cat._count.products}
                          </Badge>
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost" size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => { openCreateChild(cat); }}
                                title="Add sub-category"
                              >
                                <Plus className="w-3 h-3 mr-1" />Sub
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditParent(cat)}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ item: cat, isChild: false })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-category rows */}
                      {isOpen && hasChildren && (
                        <div className="ml-9 mb-1">
                          {cat.children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center justify-between py-2 group/child hover:bg-muted/20 -mx-4 px-4 rounded-md transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 pl-6">
                                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{child.name}</p>
                                  {child.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-sm">{child.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="text-xs font-mono hidden sm:flex">
                                  <Package className="w-3 h-3 mr-1" />
                                  {child._count.products}
                                </Badge>
                                {isSuperAdmin && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/child:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditChild(cat, child)}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteTarget({ item: child, isChild: true })}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="icon"
                        className="w-8 h-8 text-sm"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMode?.startsWith('create') ? 'Add a new' : 'Update'}{' '}
              {dialogMode?.includes('child') ? 'sub-category' : 'category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder={dialogMode?.includes('child') ? 'e.g. Smartphones, Running Shoes' : 'e.g. Electronics, Fashion'}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {dialogMode?.startsWith('create') ? 'Create' : 'Save Changes'}
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
              Delete {deleteTarget?.isChild ? 'Sub-category' : 'Category'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>&ldquo;{deleteTarget?.item.name}&rdquo;</strong>?
              {!deleteTarget?.isChild && (deleteTarget?.item as Category)?.children?.length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  This category has {(deleteTarget?.item as Category).children.length} sub-categories. Delete them first.
                </span>
              )}
              {(deleteTarget?.item._count?.products ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  {deleteTarget?.item._count.products} product{(deleteTarget?.item._count?.products ?? 0) > 1 ? 's' : ''} use this. Reassign them first.
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
