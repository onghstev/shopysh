export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError, badRequest } from '@/lib/api-helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getTenantStorageBytes, getTenantStorageLimitMb, bytesToMb } from '@/lib/storage';

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// GET - list product images
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!product) return notFound('Product not found');

    const images = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ images });
  } catch (error: any) {
    return serverError(error);
  }
}

// POST - upload a product image (multipart/form-data)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!product) return notFound('Product not found');

    const existingCount = await prisma.productImage.count({ where: { productId: params.id } });
    if (existingCount >= MAX_IMAGES) {
      return badRequest(`Maximum ${MAX_IMAGES} images allowed per product`);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return badRequest('No file provided');
    if (!ACCEPTED_TYPES.includes(file.type)) return badRequest('Only JPEG, PNG, WebP, and GIF files are allowed');
    if (file.size > MAX_FILE_SIZE) return badRequest('File size must be under 5MB');

    // Check storage quota (DB records + files on disk)
    const [{ totalBytes }, limitMb] = await Promise.all([
      getTenantStorageBytes(session.user.tenantId),
      getTenantStorageLimitMb(session.user.tenantId),
    ]);
    const limitBytes = limitMb * 1024 * 1024;
    if (totalBytes + file.size > limitBytes) {
      const usedMb = bytesToMb(totalBytes).toFixed(1);
      return badRequest(`Storage limit reached. Using ${usedMb} MB of ${limitMb} MB. Upgrade your plan or delete data to free space.`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const safeName = `${params.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const url = `/uploads/products/${safeName}`;
    const altText = (formData.get('altText') as string | null) ?? file.name.replace(/\.[^.]+$/, '');

    const image = await prisma.productImage.create({
      data: {
        productId: params.id,
        url,
        altText,
        displayOrder: existingCount,
        isPrimary: existingCount === 0,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}

// DELETE - remove a product image
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!product) return notFound('Product not found');

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    if (!imageId) return badRequest('imageId query parameter is required');

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: params.id },
    });
    if (!image) return notFound('Image not found');

    // Try to delete local file
    if (image.url.startsWith('/uploads/')) {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(path.join(process.cwd(), 'public', image.url));
      } catch {
        // ignore — file may already be gone
      }
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    // If deleted image was primary, promote the next one
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: params.id },
        orderBy: { displayOrder: 'asc' },
      });
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    // Reorder remaining
    const remaining = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { displayOrder: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].displayOrder !== i) {
        await prisma.productImage.update({ where: { id: remaining[i].id }, data: { displayOrder: i } });
      }
    }

    return NextResponse.json({ message: 'Image deleted' });
  } catch (error: any) {
    return serverError(error);
  }
}
