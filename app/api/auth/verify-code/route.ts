export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

  const accessCode = await prisma.accessCode.findUnique({
    where: { code: code.trim().toUpperCase() },
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
}
