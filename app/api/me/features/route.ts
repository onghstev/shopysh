import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// All modules — returned when tenant has no subscription (backward compat / full access)
const ALL_MODULES = ['ecommerce', 'finance', 'inventory', 'crm', 'marketing', 'communication'];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ modules: ALL_MODULES });
  }

  const sub = await prisma.subscription.findUnique({
    where: { tenantId: session.user.tenantId },
    include: { plan: { select: { features: true } } },
  });

  if (!sub) return NextResponse.json({ modules: ALL_MODULES });

  const features = (sub.plan.features ?? {}) as Record<string, any>;
  const modules: string[] = Array.isArray(features.modules) ? features.modules : ALL_MODULES;

  return NextResponse.json({ modules });
}
