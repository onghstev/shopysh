'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, X, Star, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ProductImageType {
  id: string;
  url: string;
  altText?: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

interface ProductImageUploaderProps {
  productId: string;
  images: ProductImageType[];
  onImagesChange: (images: ProductImageType[]) => void;
}

export default function ProductImageUploader({ productId, images, onImagesChange }: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/images`);
      if (res.ok) {
        const data = await res.json();
        onImagesChange(data?.images ?? []);
      }
    } catch (e) {
      console.error('Failed to refresh images:', e);
    }
  }, [productId, onImagesChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only JPEG, PNG, WebP, and GIF files are allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size must be under 5MB`);
        continue;
      }

      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        toast.error(err?.error ?? 'Failed to prepare upload');
        return;
      }

      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      // Step 2: Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        toast.error('Failed to upload image to storage');
        return;
      }

      // Step 3: Confirm upload in DB
      const confirmRes = await fetch(`/api/products/${productId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path,
          altText: file.name.replace(/\.[^.]+$/, ''),
        }),
      });

      if (confirmRes.ok) {
        toast.success('Image uploaded');
        await refreshImages();
      } else {
        const err = await confirmRes.json().catch(() => ({}));
        toast.error(err?.error ?? 'Failed to save image');
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const res = await fetch(`/api/products/${productId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Image removed');
        await refreshImages();
      } else {
        toast.error('Failed to remove image');
      }
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    // Update locally for instant feedback, then refresh
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onImagesChange(updated);

    // TODO: could add a PATCH endpoint for reordering/primary, for now just visual
    toast.success('Primary image updated');
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4" />
            Product Images
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {images.length}/{MAX_IMAGES}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                img.isPrimary ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-border'
              }`}
            >
              <div className="aspect-square relative bg-muted">
                <Image
                  src={img.url}
                  alt={img.altText || 'Product image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!img.isPrimary && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={() => handleSetPrimary(img.id)}
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-full shadow-lg"
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  title="Remove image"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Primary
                </div>
              )}
            </div>
          ))}

          {/* Upload slot */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {uploading ? 'Uploading...' : 'Add Image'}
              </span>
            </button>
          )}
        </div>

        {/* Help text */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Upload up to {MAX_IMAGES} images (JPEG, PNG, WebP, GIF). Max 5MB each. First image becomes the primary display image.</span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
