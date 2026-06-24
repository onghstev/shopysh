export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4].map(() =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return 'SHP-' + segments.join('-');
}

// POST — generate a new access code
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, billingCycle = 'monthly', expiresInDays, note } = await request.json();
  if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 });

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    const exists = await prisma.accessCode.findUnique({ where: { code } });
    if (!exists) break;
  } while (attempts < 10);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
    : null;

  const accessCode = await prisma.accessCode.create({
    data: {
      code,
      planId,
      billingCycle,
      createdByUserId: (session.user as any).id,
      expiresAt,
      note: note || null,
    },
    include: { plan: { select: { name: true } } },
  });

  return NextResponse.json({ accessCode });
}

// GET — list all access codes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { plan: { select: { name: true } } },
  });

  return NextResponse.json({ codes });
}
