export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
    if (!vendor || vendor.tenantId !== session.user.tenantId || vendor.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name: body.name ?? vendor.name,
        email: body.email ?? vendor.email,
        phone: body.phone ?? vendor.phone,
        address: body.address ?? vendor.address,
        city: body.city ?? vendor.city,
        country: body.country ?? vendor.country,
        taxId: body.taxId ?? vendor.taxId,
        bankName: body.bankName ?? vendor.bankName,
        bankAcctNo: body.bankAcctNo ?? vendor.bankAcctNo,
        paymentTerms: body.paymentTerms != null ? parseInt(body.paymentTerms) : vendor.paymentTerms,
        creditLimit: body.creditLimit != null ? parseFloat(body.creditLimit) : vendor.creditLimit,
        notes: body.notes ?? vendor.notes,
        isActive: body.isActive ?? vendor.isActive,
      },
    });

    return NextResponse.json({ vendor: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
    if (!vendor || vendor.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.vendor.update({ where: { id: params.id }, data: { deletedAt: new Date(), isActive: false } });
    return NextResponse.json({ message: 'Vendor deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
