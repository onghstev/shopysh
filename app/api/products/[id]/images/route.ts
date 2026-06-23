export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError, badRequest } from '@/lib/api-helpers';
import { generatePresignedUploadUrl, deleteFile, getFileUrl } from '@/lib/s3';

const MAX_IMAGES = 4;

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

// POST - get presigned upload URL for a new product image
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!product) return notFound('Product not found');

    // Check max images limit
    const existingCount = await prisma.productImage.count({ where: { productId: params.id } });
    if (existingCount >= MAX_IMAGES) {
      return badRequest(`Maximum ${MAX_IMAGES} images allowed per product`);
    }

    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return badRequest('fileName and contentType are required');
    }

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      return badRequest('Only image files are allowed');
    }

    // Product images are public (for storefront display)
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      `products/${params.id}/${fileName}`,
      contentType,
      true
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error: any) {
    return serverError(error);
  }
}

// PATCH - confirm upload and save image record to DB
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { cloud_storage_path, altText } = body;

    if (!cloud_storage_path) {
      return badRequest('cloud_storage_path is required');
    }

    // Build public URL for the image
    const url = await getFileUrl(cloud_storage_path, 'image/jpeg', true);

    const image = await prisma.productImage.create({
      data: {
        productId: params.id,
        url,
        altText: altText || null,
        displayOrder: existingCount,
        isPrimary: existingCount === 0, // First image is primary
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

    if (!imageId) {
      return badRequest('imageId query parameter is required');
    }

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: params.id },
    });
    if (!image) return notFound('Image not found');

    // Try to delete from S3 (extract key from URL if possible)
    try {
      const urlObj = new URL(image.url);
      const key = urlObj.pathname.slice(1); // remove leading /
      if (key) await deleteFile(key);
    } catch (e) {
      console.error('[ProductImages] Failed to delete from storage:', e);
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    // If deleted image was primary, set next one as primary
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: params.id },
        orderBy: { displayOrder: 'asc' },
      });
      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    // Reorder remaining images
    const remaining = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { displayOrder: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].displayOrder !== i) {
        await prisma.productImage.update({
          where: { id: remaining[i].id },
          data: { displayOrder: i },
        });
      }
    }

    return NextResponse.json({ message: 'Image deleted' });
  } catch (error: any) {
    return serverError(error);
  }
}
