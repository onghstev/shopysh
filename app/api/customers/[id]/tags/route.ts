export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tags = await prisma.customerTag.findMany({
      where: { customerId: params.id, tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tags);
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await request.json();
    const { tag } = body ?? {};
    if (!tag) return badRequest('Tag is required');

    // Prevent duplicate tags
    const existing = await prisma.customerTag.findFirst({
      where: { customerId: params.id, tenantId, tag },
    });
    if (existing) return badRequest('Tag already exists');

    const customerTag = await prisma.customerTag.create({
      data: { tenantId, customerId: params.id, tag },
    });
    return NextResponse.json(customerTag, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    if (!tagId) return badRequest('Tag ID is required');
    await prisma.customerTag.deleteMany({
      where: { id: tagId, customerId: params.id, tenantId: session.user.tenantId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
