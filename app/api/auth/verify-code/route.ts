export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const code = String(body.code).trim().toUpperCase();

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
      include: { plan: true },
    });

    if (!accessCode) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 404 });
    }
    if (accessCode.isUsed) {
      return NextResponse.json({ error: 'This access code has already been used' }, { status: 410 });
    }
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This access code has expired' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      code: accessCode.code,
      plan: {
        id: accessCode.plan.id,
        name: accessCode.plan.name,
        description: accessCode.plan.description,
      },
      billingCycle: accessCode.billingCycle,
      note: accessCode.note,
    });
  } catch (err: any) {
    console.error('[verify-code] error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to verify code. Please try again.' }, { status: 500 });
  }
}
