export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '20'));

    const where: any = {
      tenantId, isActive: true, deletedAt: null,
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : {}),
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchaseInvoices: true } } },
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({ vendors, total, page, pageSize });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { name, email, phone, address, city, country, taxId, bankName, bankAcctNo, paymentTerms, creditLimit, notes } = body;

    if (!name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });

    const count = await prisma.vendor.count({ where: { tenantId } });
    const code = `VND-${String(count + 1).padStart(4, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        tenantId, code, name,
        email: email ?? null, phone: phone ?? null,
        address: address ?? null, city: city ?? null,
        country: country ?? 'NG',
        taxId: taxId ?? null,
        bankName: bankName ?? null, bankAcctNo: bankAcctNo ?? null,
        paymentTerms: paymentTerms ? parseInt(paymentTerms) : 30,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
