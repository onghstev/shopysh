export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { settings: true } });
  const s = (tenant?.settings as any) ?? {};
  return NextResponse.json({
    glPostingMode: s.glPostingMode ?? 'AUTO',
    glAccountMappings: s.glAccountMappings ?? {},
    fixedAssetCategoryMappings: s.fixedAssetCategoryMappings ?? {},
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { glPostingMode, glAccountMappings, fixedAssetCategoryMappings } = body;

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { settings: true } });
  const existing = (tenant?.settings as any) ?? {};

  const updated = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      settings: {
        ...existing,
        ...(glPostingMode !== undefined ? { glPostingMode } : {}),
        ...(glAccountMappings !== undefined ? { glAccountMappings } : {}),
        ...(fixedAssetCategoryMappings !== undefined ? { fixedAssetCategoryMappings } : {}),
      },
    },
    select: { settings: true },
  });

  const s = (updated.settings as any) ?? {};
  return NextResponse.json({
    glPostingMode: s.glPostingMode,
    glAccountMappings: s.glAccountMappings ?? {},
    fixedAssetCategoryMappings: s.fixedAssetCategoryMappings ?? {},
  });
}
