export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/customer-auth';
import { generateCustomerCode } from '@/lib/generate-code';

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const body = await request.json();
    const { name, phone, email, password } = body ?? {};

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, phone, and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if customer already exists
    const existing = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone },
    });

    if (existing?.passwordHash) {
      return NextResponse.json({ error: 'Account already exists. Please log in.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let customer;
    if (existing) {
      // Upgrade anonymous customer to registered
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: { name, email: email || existing.email, passwordHash, acquisitionSource: existing.acquisitionSource || 'storefront' },
      });
    } else {
      const customerCode = await generateCustomerCode(tenant.id);
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          customerCode,
          phone,
          name,
          email: email || null,
          passwordHash,
          acquisitionSource: 'storefront',
          segment: 'New',
          lastInteractionAt: new Date(),
        },
      });
    }

    const token = signCustomerToken({
      customerId: customer.id,
      tenantId: tenant.id,
      phone: customer.phone,
      name: customer.name || undefined,
    });

    return NextResponse.json({
      token,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Customer register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
