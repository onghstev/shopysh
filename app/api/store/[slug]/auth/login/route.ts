export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/customer-auth';

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.slug, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const body = await request.json();
    const { phone, password } = body ?? {};

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone, deletedAt: null, isBlocked: false },
    });

    if (!customer) {
      return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 401 });
    }
    if (!customer.passwordHash) {
      return NextResponse.json({
        error: 'You have not set a password yet. Please use "Sign Up" to create a password for this phone number, or use "Track Order" to find your orders without logging in.',
      }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid phone or password' }, { status: 401 });
    }

    // Update last interaction
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastInteractionAt: new Date() },
    });

    const token = signCustomerToken({
      customerId: customer.id,
      tenantId: tenant.id,
      phone: customer.phone,
      name: customer.name || undefined,
    });

    return NextResponse.json({
      token,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
